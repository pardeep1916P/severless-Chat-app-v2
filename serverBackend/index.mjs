import AWS from 'aws-sdk';

const ddb = new AWS.DynamoDB.DocumentClient();
const client = new AWS.ApiGatewayManagementApi({
  endpoint: 'api-gateway.endpointUrl',
});

const CONNECTIONS_TABLE = 'ChatConnections';
const COUNTERS_TABLE = 'ChatCounters';

const ensureCounterExists = async () => {
  try {
    await ddb.put({
      TableName: COUNTERS_TABLE,
      Item: { counterType: 'anonymous', count: 0 },
      ConditionExpression: 'attribute_not_exists(counterType)',
    }).promise();
  } catch (err) {
    if (err.code !== 'ConditionalCheckFailedException') throw err;
  }
};

const getNextAnonymousName = async () => {
  const result = await ddb.update({
    TableName: COUNTERS_TABLE,
    Key: { counterType: 'anonymous' },
    UpdateExpression: 'SET #c = if_not_exists(#c, :zero) + :inc',
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
    ReturnValues: 'UPDATED_NEW',
  }).promise();
  return `Anonymous${result.Attributes.count}`;
};

const saveConnection = async (connectionId, name, isGhost = false) =>
  ddb.put({ TableName: CONNECTIONS_TABLE, Item: { connectionId, name, isGhost } }).promise();

const deleteConnection = async (connectionId) =>
  ddb.delete({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();

const getAllConnections = async () =>
  (await ddb.scan({ TableName: CONNECTIONS_TABLE }).promise()).Items || [];

const getNameByConnectionId = async (connectionId) => {
  const res = await ddb.get({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
  return res.Item?.name || null;
};

const getConnectionIdsByName = async (name) =>
  (await ddb.scan({
    TableName: CONNECTIONS_TABLE,
    FilterExpression: '#n = :name',
    ExpressionAttributeNames: { '#n': 'name' },
    ExpressionAttributeValues: { ':name': name },
  }).promise()).Items?.map((item) => item.connectionId) || [];

const getGhostConnections = async () =>
  (await ddb.scan({
    TableName: CONNECTIONS_TABLE,
    FilterExpression: 'isGhost = :true',
    ExpressionAttributeValues: { ':true': true },
  }).promise()).Items || [];

const updateGhostStatus = async (connectionId, isGhost) =>
  ddb.update({
    TableName: CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET isGhost = :g',
    ExpressionAttributeValues: { ':g': isGhost },
    ReturnValues: 'ALL_NEW'
  }).promise();

const sendToOne = async (id, body) => {
  try {
    await client.postToConnection({
      ConnectionId: id,
      Data: Buffer.from(JSON.stringify(body)),
    }).promise();
  } catch (e) { }
};

const sendToAll = async (connections, body) =>
  Promise.all(connections.map((c) => sendToOne(c.connectionId, body)));

const resetAnonymousCounter = async () =>
  ddb.update({
    TableName: COUNTERS_TABLE,
    Key: { counterType: 'anonymous' },
    UpdateExpression: 'SET #c = :zero',
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: { ':zero': 0 },
  }).promise();

const formatMembers = (connections) =>
  connections.map((c) => ({ name: c.name, id: c.connectionId, isGhost: c.isGhost || false }));

export const handler = async (event) => {
  const connectionId = event.requestContext?.connectionId;
  const routeKey = event.requestContext?.routeKey;

  let body = {};
  try {
    if (event.body) body = JSON.parse(event.body);
  } catch (e) { }

  try {
    if (routeKey === '$connect') {
      await ensureCounterExists();
      await sendToOne(connectionId, { clientId: connectionId });
    }
    else if (routeKey === '$disconnect') {
      const leaverName = await getNameByConnectionId(connectionId) || 'Unknown user';
      await deleteConnection(connectionId);
      const remaining = await getAllConnections();
      if (remaining.length === 0) await resetAnonymousCounter();
      await sendToAll(remaining, { systemMessage: `${leaverName} has left the chat.` });
      await sendToAll(remaining, { members: formatMembers(remaining) });
    }
    else {
      switch (body.action) {
        case 'setName': {
          let username = body.name?.trim();
          if (!username) username = await getNextAnonymousName();
          await saveConnection(connectionId, username, false);
          const allUsers = await getAllConnections();
          await sendToAll(allUsers, { systemMessage: `${username} has joined the chat.` });
          await sendToAll(allUsers, { members: formatMembers(allUsers) });
          await sendToOne(connectionId, { clientId: connectionId });
          break;
        }

        case 'sendPublic': {
          const senderName = await getNameByConnectionId(connectionId);
          const everyone = await getAllConnections();
          await sendToAll(everyone, {
            publicMessage: `${senderName}: ${body.message}`,
            senderId: connectionId
          });
          break;
        }

        case 'sendPrivate': {
          const fromName = await getNameByConnectionId(connectionId);
          const toName = body.to;
          const targets = await getConnectionIdsByName(toName);
          const ghosts = await getGhostConnections();

          if (targets.length > 0) {
            for (const t of targets)
              await sendToOne(t, { privateMessage: `${fromName}: ${body.message}`, senderId: connectionId });

            await sendToOne(connectionId, {
              privateMessage: `To ${toName}: ${body.message}`,
              senderId: connectionId
            });

            const ghostViewMessage = `(Private) ${fromName} TO ${toName}: ${body.message}`;
            for (const g of ghosts) {
              const isSender = g.connectionId === connectionId;
              const isReceiver = g.name === toName;
              if (!isSender && !isReceiver) {
                await sendToOne(g.connectionId, { ghostView: ghostViewMessage });
              }
            }
          } else {
            await sendToOne(connectionId, { systemMessage: `User "${toName}" not found.` });
          }
          break;
        }

        case 'verifyGhost': {
          if (body.passkey === 'Akm032') {
            const user = await ddb.get({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
            if (user.Item) {
              await updateGhostStatus(connectionId, true);
              await sendToOne(connectionId, { action: 'verifyGhostResponse', verified: true });
              const allGhosts = await getGhostConnections();
              for (const g of allGhosts) {
                if (g.connectionId !== connectionId) {
                  await sendToOne(g.connectionId, { systemMessage: `${user.Item.name} entered ghost mode` });
                }
              }
              const everyoneNow = await getAllConnections();
              await sendToAll(everyoneNow, { members: formatMembers(everyoneNow) });
            } else {
              await sendToOne(connectionId, { action: 'verifyGhostResponse', verified: false });
            }
          } else {
            await sendToOne(connectionId, { action: 'verifyGhostResponse', verified: false });
          }
          break;
        }

        case 'disableGhost': {
          await updateGhostStatus(connectionId, false);
          await sendToOne(connectionId, { systemMessage: 'Ghost mode disabled.' });
          const leftName = await getNameByConnectionId(connectionId);
          const ghostsLeft = await getGhostConnections();
          for (const g of ghostsLeft) {
            if (g.connectionId !== connectionId) {
              await sendToOne(g.connectionId, { systemMessage: `${leftName} left ghost mode` });
            }
          }
          const everyoneNow2 = await getAllConnections();
          await sendToAll(everyoneNow2, { members: formatMembers(everyoneNow2) });
          break;
        }

        default:
          break;
      }
    }
  } catch (err) { }

  return { statusCode: 200, body: 'OK' };
};
