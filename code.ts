const Mode = {
  Dark: 'dark',
  Light: 'light',
  Elevated: 'elevated',
}
let mode = undefined
const localStyles = figma.getLocalPaintStyles()
let teamStyles = []
let styleManager: StyleManager = undefined

async function main() {
  if (Object.keys(Mode).find(key => Mode[key] === figma.command) != undefined) {
    mode = figma.command
  } else if (figma.command == 'saveFromTeamLibrary') {
    const succeeded = await TeamColorsManager.saveTeamStyleKeysToStorage()
    return figma.closePlugin(succeeded ? 'Style saved' : 'This document does not have styles')
  } else {
    figma.closePlugin()
  }

  try {
    teamStyles = await TeamColorsManager.loadTeamStylesFromStorage()
    styleManager = new StyleManager([...localStyles, ...teamStyles])
    for (let i = 0; i < figma.currentPage.selection.length; i++) {
      replaceNodes([figma.currentPage.selection[i]])
    }
  }
  catch (e) {
    const error = e.toString()
    return figma.closePlugin(error)
  }

  figma.closePlugin()
}

function replaceNodes(nodes: Array<any>): void {
  for (const node of nodes) {
    const fillStyleName: string = styleManager.getStyleNameById(node.fillStyleId)
    const strokeStyleName: string = styleManager.getStyleNameById(node.strokeStyleId)
    if (fillStyleName != null) {
      const replacedColorStyleName: string = replaceColorStyleName(fillStyleName)
      const replacedFillStyleId: string = styleManager.getStyleIdByName(replacedColorStyleName)
      node.fillStyleId = replacedFillStyleId
    }

    if (strokeStyleName != null) {
      const replacedStrokeColorStyleName: string = replaceColorStyleName(strokeStyleName)
      const replacedStrokeStyleId: string = styleManager.getStyleIdByName(replacedStrokeColorStyleName)
      node.strokeStyleId = replacedStrokeStyleId
    }

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      replaceNodes(node.children)
    }
  }
}

function replaceColorStyleName(paintStyleName: string): string {
  const splitPaintStyleName = paintStyleName.split('/')
  const replacedNodePaintStyleNames = []

  for (let i = 0; i < splitPaintStyleName.length; i++) {
    const name = new StyleKeyword(splitPaintStyleName[i], mode)
    replacedNodePaintStyleNames.push(name.switch())
  }
  return replacedNodePaintStyleNames.join('/')
}

class TeamColorsManager {
  key: string = "darkModeSwitcher.teamColorKeys"

  static async saveTeamStyleKeysToStorage(): Promise<boolean> {
    if (figma.getLocalPaintStyles().length != 0) {
      await figma.clientStorage.setAsync('darkModeSwitcher.teamColorKeys', figma.getLocalPaintStyles().map(a => a.key))
      return true
    }
    return false
  }

  static async loadTeamStylesFromStorage(): Promise<Array<BaseStyle>> {
    const teamColorKeys = await figma.clientStorage.getAsync('darkModeSwitcher.teamColorKeys')
    if (!teamColorKeys) {
      console.log("The team colors were not found. Please run 'save' on the styles page before run any replace commands.")
      return []
    }

    const teamStyles = []
    for (let key of teamColorKeys) {
      const style = await figma.importStyleByKeyAsync(key)
      if (style) {
        teamStyles.push(style)
      }
    }
    return teamStyles
  }
}

class StyleManager {
  styles: Array<BaseStyle>

  constructor(styles: Array<BaseStyle>) {
    this.styles = styles
  }

  getStyleNameById(currentStyleId: string): string {
    let style = this.styles.find(style => style.id == currentStyleId)
    return (style != undefined) ? style.name : null
  }

  getStyleIdByName(replacedColorStyleName: string): string {
    let style = this.styles.find(style => style.name == replacedColorStyleName)
    return (style != undefined) ? style.id : null
  }
}

class StyleKeyword {
  name: string
  mode: string

  constructor(name: string, mode: string) {
    this.name = name
    this.mode = mode
  }

  switch(): string {
    if (!this.isModeKeyword) {
      return this.name
    }
    if (this.capitalized(this.name)) {
      return this.capitalize(this.mode)
    }
    return this.mode
  }

  get isModeKeyword(): boolean {
    const found = Object.keys(Mode).find((mode) => mode.toLowerCase() === this.name.toLowerCase())
    return (found != undefined)
  }

  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.toLowerCase().slice(1)
  }

  capitalized(text: string): boolean {
    return (text === this.capitalize(text))
  }
}

main()
