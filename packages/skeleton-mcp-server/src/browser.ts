import open from 'open';

export async function openBrowser(url: string): Promise<void> {
  await open(url);
}

export class BrowserState {
  browserOpened = false;
  private readonly opener: (url: string) => Promise<void>;

  constructor(opener: (url: string) => Promise<void> = openBrowser) {
    this.opener = opener;
  }

  async openOnce(url: string): Promise<void> {
    if (!this.browserOpened) {
      this.browserOpened = true;
      await this.opener(url);
    }
  }
}
