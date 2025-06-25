// this will trigger backend singleton creation
import { app } from 'electron';
import { join } from 'path';
import './backend.js';
import { backend } from './backend.js';
import { LLMModelRegistry } from './helpers/llm-model-registry.js';
import { subprocessManager } from './subprocess/subprocess-manager.js';

app.whenReady().then(() => {
  subprocessManager.startProcess({
    modulePath: 'local-model-download-subprocess.js',
    serviceName: 'localModelDownload',
    args: [join(app.getPath('userData'), 'models')],
  })

  subprocessManager.onMessage('localModelDownload', (message) => {
    if (message.type == 'downloadStatus') {
      backend.getMainWindow()?.windowInstance.webContents.send('llm.statusUpdate', { ...message, isComplete: false });

      if (message.isComplete) {
        LLMModelRegistry.sync().finally(() => {
          backend.getMainWindow()?.windowInstance.webContents.send('llm.statusUpdate', { ...message, isComplete: true });
        })
      }
    }
  })
})
