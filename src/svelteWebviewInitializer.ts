import * as vscode from 'vscode'

export class SvelteWebviewInitializer {
  constructor(private context: vscode.ExtensionContext) {}

  initialize(view: string, webView: vscode.Webview): void {
    webView.options = this.getWebViewOptions(this.context, view)
    webView.html = this.getHtmlContent(this.context, view, webView)
  }

  private getHtmlContent(
    context: vscode.ExtensionContext,
    view: string,
    webView: vscode.Webview
  ): string {
    const nonce = this.getNonce()
    const scriptUri = webView.asWebviewUri(
      this.getSvelteAppDistributionIndexJsUri(context, view)
    )
    const stylesUri = webView.asWebviewUri(this.getStylesUri(context))
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset='UTF-8'>
        <!--
          Use a content security policy to only allow loading images from https or from our extension directory,
          and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webView.cspSource}; img-src ${webView.cspSource} https:; script-src 'nonce-${nonce}';">
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <link href="${stylesUri}" rel="stylesheet" type="text/css" />
    </head>
    <body>
    </body>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</html>
`
  }

  private getNonce(): string {
    let text = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  private getWebViewOptions(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.WebviewPanelOptions & vscode.WebviewOptions {
    return {
      enableScripts: true,
      localResourceRoots: [
        this.getSvelteAppDistributionFolderUri(context),
        this.getSvelteAppDistributionViewFolderUri(context, view),
      ],
    }
  }

  private getSvelteAppDistributionFolderUri(
    context: vscode.ExtensionContext
  ): vscode.Uri {
    return vscode.Uri.joinPath(context.extensionUri, 'svelte', 'dist')
  }

  private getSvelteAppDistributionViewFolderUri(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'views',
      view
    )
  }

  private getSvelteAppDistributionIndexJsUri(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'views',
      view,
      'index.js'
    )
  }

  private getStylesUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'styles.css'
    )
  }
}
