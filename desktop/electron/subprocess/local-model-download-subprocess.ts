import { createModelDownloader, ModelDownloader } from 'node-llama-cpp';
import { BaseSubprocess } from "./base-subbprocess.js";

interface IStartDownloadMessage {
  type: 'startDownload';
  url: string;
  output: string;
}

interface ICancelDownloadMessage {
  type: 'cancelDownload';
  url: string;
}


class LocalModelDownloadSubprocess extends BaseSubprocess {
  private downloaders!: Map<string, { downloader: ModelDownloader, startTime: number }>;

  async onInitialize(): Promise<void> {
    this.downloaders = new Map();
  }

  async *handleMessageGenerator() { }

  async handleMessage(message: IStartDownloadMessage | ICancelDownloadMessage) {
    // Handle incoming messages specific to file downloads
    switch (message.type) {
      case 'startDownload':
        this.startDownload(message);
        break;
      case 'cancelDownload':
        this.cancelDownload(message);
        break;
      default:
        this.warn("Unknown message type:", message);
    }
  }

  async startDownload({ url, output }: IStartDownloadMessage): Promise<void> {
    if (this.downloaders.has(url)) {
      this.warn(`Download for ${url} is already in progress.`);
      return;
    }


    const downloader = await createModelDownloader({
      modelUri: url,
      dirPath: process.argv[2],
      fileName: output
    })
    this.downloaders.set(url, { downloader, startTime: Date.now() });

    const interval = setInterval(() => {
      this.sendStatus(url);
    }, 50);

    downloader?.download?.()
      .finally(() => {
        this.downloaders.delete(url);
        this.info(`Download completed for ${url}`);
        this.send({
          type: 'downloadStatus',
          url,
          isComplete: true,
        })
        clearInterval(interval);
      })
  }

  sendStatus(url: string): void {
    const downloader = this.downloaders.get(url)?.downloader;
    if (!downloader) {
      this.warn(`No download in progress for ${url}.`);
      return;
    }

    this.send({
      type: 'downloadStatus',
      url,
      isComplete: false,
      progress: downloader.downloadedSize / downloader.totalSize,
      totalSize: downloader.totalSize,
      downloadedSize: downloader.downloadedSize,
      elapsedTime: Date.now() - this.downloaders.get(url)!.startTime,
      speed: downloader.downloadedSize / ((Date.now() - this.downloaders.get(url)!.startTime) / 1000),
      eta: downloader.totalSize ? (downloader.totalSize - downloader.downloadedSize) / (downloader.downloadedSize / ((Date.now() - this.downloaders.get(url)!.startTime) / 1000)) : 0,
    })
  }


  async cancelDownload({ url }: ICancelDownloadMessage): Promise<void> {
    const downloader = this.downloaders.get(url);
    if (!downloader) {
      this.warn(`No download in progress for ${url}.`);
      return;
    }
    await downloader.downloader.cancel();
    this.downloaders.delete(url);
  }
}

import { fileURLToPath } from 'url';
const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === currentFile;

if (isMain) {
  new LocalModelDownloadSubprocess();
}