export default racerModelSocket => (primusClient, options) => {
  racerModelSocket = racerModelSocket || options.racerModelSocket;

  if (!racerModelSocket) {
    throw new Error('racerModelSocket is required');
  }

  racerModelSocket.primus = this;
  racerModelSocket.readyState = primusClient.readyState;

  racerModelSocket.close = () => {
    primusClient.end();
  };

  racerModelSocket.open = () => {
    primusClient.open();
  };

  racerModelSocket.send = data => {
    primusClient.write(data);
  };

  primusClient.on('data', data => {
    racerModelSocket.onmessage({data});
  });

  primusClient.on('error', err => {
    racerModelSocket.onerror(err);
  });

  primusClient.on('readyStateChange', state => {
    racerModelSocket.readyState = primusClient.readyState;

    if (state === 'end') {
      racerModelSocket.onclose();
    } else if (state === 'opening') {
      racerModelSocket.onopen();
    }
  });
};
