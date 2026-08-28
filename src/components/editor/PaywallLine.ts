import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap extension: PaywallLine
 * Renders a special "paid content starts here" divider block.
 */
export const PaywallLine = Node.create({
  name: 'paywallLine',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="paywall-line"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'paywall-line' }),
    ];
  },

  addNodeView() {
    return () => {
      const container = document.createElement('div');
      container.setAttribute('data-type', 'paywall-line');
      container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 24px 0;
        cursor: default;
        user-select: none;
      `;

      const line = document.createElement('div');
      line.style.cssText = `flex:1; height:2px; background: linear-gradient(90deg, rgba(217,180,91,0), rgba(217,180,91,0.8), rgba(217,180,91,0));`;

      const badge = document.createElement('div');
      badge.textContent = '💰 ここから有料コンテンツ';
      badge.style.cssText = `
        padding: 4px 16px;
        border-radius: 999px;
        background: rgba(217,180,91,0.15);
        border: 1px solid rgba(217,180,91,0.5);
        color: #f2d992;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        letter-spacing: 0.04em;
      `;

      const line2 = document.createElement('div');
      line2.style.cssText = line.style.cssText;

      container.appendChild(line);
      container.appendChild(badge);
      container.appendChild(line2);

      return { dom: container };
    };
  },

  addCommands() {
    return {
      insertPaywallLine:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({ type: this.name });
        },
    } as any;
  },
});
