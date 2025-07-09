import {
  Rule,
  SchematicContext,
  Tree,
  chain
} from '@angular-devkit/schematics';

import { Schema as NgAddSchema } from './schema';

export function ngAdd(_options: NgAddSchema): Rule {
  return chain([
    createPingFile(_options),
    logMessage()
  ]);
}

function createPingFile(options: NgAddSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = options.pingPath || 'src/assets/ping.txt';

    if (!tree.exists(path)) {
      tree.create(path, 'Network Ping');
      context.logger.info(`✅ Created ${path}`);
    } else {
      context.logger.warn(`⚠️ ${path} already exists. Skipping.`);
    }

    return tree;
  };
}

function logMessage(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('✅ ngx-network-monitor has been added.');
    context.logger.info('📡 Monitor service is ready. Remember to configure the PING_URL if needed.');
    return _tree;
  };
}
