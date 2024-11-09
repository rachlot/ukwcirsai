// Load logincfg.json
// Use fetch to use the app's origin because it might differ from the API

const loginConfig = await (await fetch("/assets/logincfg.json")).json();

export default loginConfig;
