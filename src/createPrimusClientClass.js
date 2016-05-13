import PrimusClient from 'primus/primus.js';

export default function ({authorization, parser, pathname, plugin, transformer}) {
  function CustomPrimusClient() {
    PrimusClient.apply(this, arguments);
  }

  CustomPrimusClient.prototype = Object.create(PrimusClient.prototype);
  CustomPrimusClient.prototype.ark = plugin || {};
  CustomPrimusClient.prototype.authorization = authorization;
  CustomPrimusClient.prototype.client = transformer;
  CustomPrimusClient.prototype.decoder = parser.decoder;
  CustomPrimusClient.prototype.encoder = parser.encoder;
  CustomPrimusClient.prototype.pathname = pathname;

  return CustomPrimusClient;
}
