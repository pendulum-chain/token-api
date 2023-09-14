const { ApiPromise, WsProvider } = require("@polkadot/api");
const { amplitudeWss, pendulumWss } = require("../../config/vars");

const apiInstance = {};

const getApi = async (network) => {

    const websocketUrl = network === "amplitude" ? amplitudeWss : pendulumWss;

    if (!apiInstance[network]) {
        console.log(`Connecting to node ${websocketUrl}...`);
        const wsProvider = new WsProvider(websocketUrl);
        apiInstance[network] = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
        console.log(`Connected to node ${websocketUrl}`);
    }

    return apiInstance[network];
};

const executeApiCall = async (network, apiCall) => {

    const apiInstance = await getApi(network);

    const websocketUrl = network === "amplitude" ? amplitudeWss : pendulumWss;

    try {
        return await apiCall(apiInstance);
    } catch (initialError) {
        try {
            console.log(`Attempting to reconnect to node ${websocketUrl}...`);
            const wsProvider = new WsProvider(websocketUrl);
            apiInstance = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
            console.log(`Reconnected to node ${websocketUrl}`);

            return await apiCall(apiInstance);
        } catch (reconnectError) {
            console.error('Failed to reconnect and execute the API call', reconnectError);
            throw initialError;
        }
    }
};

exports.executeApiCall = executeApiCall;