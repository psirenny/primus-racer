import async from 'async';
import express from 'express';
import getport from 'getport';
import {createPrimusClientClass, plugin, pluginClient} from '../src/index.js';
import PrimusParserJson from 'primus/parsers/json';
import PrimusTransformerWebsocketsClient from 'primus/transformers/websockets/client';
import PrimusServer from 'primus';
import http from 'http';
import racerClient from 'racer-client';
import racerServer from 'racer';
import tape from 'tape';
import WebSocket from 'ws';

global.WebSocket = WebSocket;

tape('create primus client class', t => {
  t.plan(8);

  const authorization = false;
  const parser = PrimusParserJson;
  const pathname = '/primus';
  const plugin = {racer: pluginClient()};
  const transformer = PrimusTransformerWebsocketsClient;

  t.equal(typeof createPrimusClientClass, 'function');

  const PrimusClientWebsockets = createPrimusClientClass({
    authorization, parser, pathname, plugin, transformer
  });

  t.equal(typeof PrimusClientWebsockets, 'function');
  t.deepEqual(PrimusClientWebsockets.prototype.ark, plugin);
  t.equal(PrimusClientWebsockets.prototype.authorization, authorization);
  t.equal(PrimusClientWebsockets.prototype.client, transformer);
  t.equal(PrimusClientWebsockets.prototype.decoder, parser.decoder);
  t.equal(PrimusClientWebsockets.prototype.encoder, parser.encoder);
  t.equal(PrimusClientWebsockets.prototype.pathname, pathname);
});

tape('connect primus server to racerBackend', t => {
  console.time('test');
  t.plan(15);

  const httpApp = express();
  const httpServer = http.createServer(httpApp);
  const racerBackend = racerServer.createBackend();
  const racerClientModelSocket = {};

  const primusServer = new PrimusServer(httpServer, {
    parser: PrimusParserJson,
    pathname: '/primus',
    plugin: {racer: plugin(racerBackend)},
    transformer: 'websockets'
  });

  const PrimusClientWebsockets = createPrimusClientClass({
    parser: PrimusParserJson,
    pathname: '/primus',
    plugin: {racer: pluginClient(racerClientModelSocket)},
    transformer: PrimusTransformerWebsocketsClient
  });

  getport((err, port) => {
    t.error(err);

    const primusClient = new PrimusClientWebsockets({
      manual: true,
      url: `http://localhost:${port}`
    });

    racerClient.Model.prototype._createSocket = () => racerClientModelSocket;
    const modelClient = racerClient.createModel();
    const modelServer = racerBackend.createModel();

    modelClient.createConnection();

    httpServer.listen(port, err => {
      t.error(err);

      const run = async.timeout(done => {
        async.series([
          done => {
            modelClient.once('change', '$connection.state', state => {
              t.equal(state, 'connecting');
              done();
            });

            modelClient.connect();
          },
          done => {
            modelClient.once('change', '$connection.state', state => {
              t.equal(state, 'connected');
              done();
            });
          },
          done => {
            modelClient.add('foo', {id: 'bar', value: 'baz'}, err => {
              t.error(err);
              done();
            });
          },
          done => {
            const $fooBarClient = modelClient.at('foo.bar');
            const $fooBarServer = modelServer.at('foo.bar');

            $fooBarClient.subscribe(err => {
              t.error(err);

              $fooBarServer.fetch(err => {
                t.error(err);

                $fooBarServer.set('value', 'qux', err => {
                  t.error(err);
                });

                modelClient.once('change', 'foo.bar.value', value => {
                  t.equal(value, 'qux');
                  $fooBarClient.unsubscribe();
                  done();
                });
              });
            });
          },
          done => {
            modelClient.disconnect();
            t.equal(modelClient.get('$connection.state'), 'disconnected');
            done();
          },
          done => {
            modelClient.once('change', '$connection.state', state => {
              t.equal(state, 'disconnected');

              modelClient.once('change', '$connection.state', state => {
                t.equal(state, 'connecting');
                done();
              });
            });

            modelClient.connect();
          },
          done => {
            const $fooBarClient = modelClient.at('foo.bar');

            $fooBarClient.fetch(err => {
              t.error(err);

              racerBackend.use('after submit', (shareReq, next) => {
                next('error no matter what');
              });

              $fooBarClient.set('value', 'asdf', err => {
                t.ok(err);
                done();
              });
            });
          }
        ], done);
      }, 2000);

      run(err => {
        t.error(err);
        httpServer.close();
        primusClient.end();
        primusServer.destroy();
        console.timeEnd('test');
      });
    });
  });
});
