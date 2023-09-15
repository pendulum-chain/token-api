const { ApiPromise, WsProvider } = require("@polkadot/api");
const { amplitudeWss, pendulumWss } = require("../../config/vars");

const apiInstanceDict = {};

const connectApi = async (socketUrl) => {

    const wsProvider = new WsProvider(socketUrl);
    return ApiPromise.create({ provider: wsProvider, noInitWarn: true });

}

const getApi = async (network) => {

    const websocketUrl = network === "amplitude" ? amplitudeWss : pendulumWss;

    if (!apiInstanceDict[network]) {
        console.log(`Connecting to node ${websocketUrl}...`);
        apiInstanceDict[network] = await connectApi(websocketUrl);
        console.log(`Connected to node ${websocketUrl}`);
    }

    return apiInstanceDict[network];
};

const executeApiCall = async (network, apiCall) => {

    const apiInstance = await getApi(network);

    const websocketUrl = network === "amplitude" ? amplitudeWss : pendulumWss;

    try {
        return await apiCall(apiInstance);
    } catch (initialError) {
        try {
            console.log(`Attempting to reconnect to node ${websocketUrl}...`);
            apiInstanceDict[network] = await connectApi(websocketUrl);
            console.log(`Reconnected to node ${websocketUrl}`);

            return await apiCall(apiInstance);
        } catch (reconnectError) {
            console.error('Failed to reconnect and execute the API call', reconnectError);
            throw initialError;
        }
    }
};

exports.executeApiCall = executeApiCall;