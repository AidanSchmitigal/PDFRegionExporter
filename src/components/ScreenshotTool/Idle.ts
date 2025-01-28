import { StateNode } from 'tldraw'

export class ScreenshotIdle extends StateNode {
	static override id = 'idle'

	override onPointerDown() {
		this.parent.transition('pointing')
	}
}