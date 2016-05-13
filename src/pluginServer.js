import SparkClientStream from './SparkClientStream';

export default racerBackend => (primusServer, options) => {
  racerBackend = racerBackend || options.racerBackend;

  if (!racerBackend) {
    throw new Error('racerBackend is required');
  }

  primusServer.on('connection', sparkClient => {
    racerBackend.listen(
      new SparkClientStream(sparkClient),
      sparkClient.request
    );
  });
};
