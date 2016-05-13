import client from './pluginClient';
import server from './pluginServer';

export default racerBackend => ({
  client: client(),
  server: server(racerBackend)
});
