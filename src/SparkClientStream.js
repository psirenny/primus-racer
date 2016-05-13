import {Duplex} from 'stream';

class Stream extends Duplex {
  constructor(sparkClient) {
    super({objectMode: true});

    this.sparkClient = sparkClient;

    sparkClient.on('data', data => this.push(data));
    sparkClient.on('end', () => this.push(null));

    this.on('error', err => sparkClient.end());
    this.on('finish', () => sparkClient.end());
  }

  _read() {}

  _write(chunk, encoding, callback) {
    this.sparkClient.write(chunk);
    callback();
  }
}

export default Stream;
