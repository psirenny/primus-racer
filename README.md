# primus-racer

A [Primus](https://github.com/primus/primus) plugin for the realtime model sync engine [Racer](https://github.com/derbyjs/racer).

Refer to the Primus docs on what can be configured.
You can change the transport type, enable compression, etc...

## Installation

    npm install --save primus primus-racer ws

## Example Server Usage

    import http from 'http';
    import Primus from 'primus';
    import jsonParser from 'primus/parsers/json';
    import racer from 'racer';
    import racerPlugin = from 'primus-racer/lib/plugin';
    const websocketTransformer = 'websockets';

    const createApp = (backend, port) => express()
      .use(backend.modelMiddleware())
      .use((req, res, next) => {
        const model = req.getModel();
        model.set('_primus.url', 'http://localhost:' + port);
        next();
      });

    const backend = racer.createBackend(/* ... */);
    const httpPort = 3000;
    const httpServer = http.createServer(
      createApp(backend, httpPort)
    );

    // If you're using Derby you should set this flag to true
    // because Derby uses the cluster module in development
    const iknowclusterwillbreakconnections = process.env.NODE_ENV === 'development';

    const primus = new Primus(httpServer, {
      iknowclusterwillbreakconnections: iknowclusterwillbreakconnections,
      parser: jsonParser,
      pathname: '/primus',
      plugin: {racer: racerPlugin(backend)},
      transformer: websocketTransformer
    });

    httpServer.listen(httpPort);

## Example Client Usage

    import derby from 'derby';
    import jsonParser from 'primus/parsers/json';
    import websocketTransformer from 'primus/transformers/websockets/client';
    import {createPrimusClientClass, pluginClient as racerPlugin} from 'primus-racer';

    derby.use(derby => {
      const Primus = createPrimusClientClass({
        parser: jsonParser,
        pathname: '/primus',
        plugin: {racer: racerPlugin()},
        transformer: websocketTransformer
      });

      derby.Model.prototype._createSocket = data => {
        const socket = {};
        const url = data.collections._primus.url;
        const primus = new Primus({racerModelSocket: socket, url: url});
        return socket;
      };
    });
