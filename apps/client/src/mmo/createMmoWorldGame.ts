import Phaser from 'phaser';

class MmoFoundationScene extends Phaser.Scene {
  constructor() {
    super('mmo-foundation');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#8ccbc0');
    this.add.ellipse(width / 2, height * 0.72, width * 1.25, height * 0.52, 0x6eaa83);
    this.add.circle(width / 2, height * 0.54, 24, 0xfff8e8).setStrokeStyle(5, 0x684338);
    this.add.circle(width / 2 - 40, height * 0.59, 17, 0xffbd91).setStrokeStyle(4, 0x684338);
    this.add.circle(width / 2 + 40, height * 0.59, 17, 0xd9c5ef).setStrokeStyle(4, 0x684338);
    this.add
      .text(width / 2, height * 0.28, 'World channel connected', {
        color: '#3b3434',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }
}

export function createMmoWorldGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 800,
    height: parent.clientHeight || 600,
    backgroundColor: '#8ccbc0',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    scene: [MmoFoundationScene],
  });
}
