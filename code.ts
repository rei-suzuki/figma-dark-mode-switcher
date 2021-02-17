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
      try {
        replaceNodes([figma.currentPage.selection[i]])
      } catch (e) {
        const error = e.toString()
        figma.notify(error)
      }
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
      const replacedColorStyleName: string = Replacer.replace(fillStyleName, mode)
      const replacedFillStyleId: string = styleManager.getStyleIdByName(replacedColorStyleName)
      node.fillStyleId = replacedFillStyleId
    }

    if (strokeStyleName != null) {
      const replacedStrokeColorStyleName: string = Replacer.replace(strokeStyleName, mode)
      const replacedStrokeStyleId: string = styleManager.getStyleIdByName(replacedStrokeColorStyleName)
      node.strokeStyleId = replacedStrokeStyleId
    }

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      replaceNodes(node.children)
    }
  }
}
class TeamColorsManager {
  static key: string = "darkModeSwitcher.teamColorKeys"

  static async saveTeamStyleKeysToStorage(): Promise<boolean> {
    if (figma.getLocalPaintStyles().length != 0) {
      await figma.clientStorage.setAsync(this.key, figma.getLocalPaintStyles().map(a => a.key))
      return true
    }
    return false
  }

  static async loadTeamStylesFromStorage(): Promise<Array<BaseStyle>> {
    const teamColorKeys = await figma.clientStorage.getAsync(this.key)
    if (!teamColorKeys) {
      console.log("The team colors were not found. Please run 'save' on the styles page before run any replace commands.")
      return []
    }

    const teamStyles = []
    for (let key of teamColorKeys) {
      try {
        const style = await figma.importStyleByKeyAsync(key)
        if (style) {
          teamStyles.push(style)
        }
      } catch (e) {
        console.log(e)
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

class Replacer {
  static replace(name: string, to: string): string {
    const keywords = Object.keys(Mode).map((key) => Mode[key])
    for (let from of keywords) {
      if (name.match(from)) {
        return name.replace(from, to)
      }
      const capitalizedFrom = this.capitalize(from)
      if (name.match(capitalizedFrom)) {
        return name.replace(capitalizedFrom, this.capitalize(to))
      }
    }
    return name
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.toLowerCase().slice(1)
  }
}

main()
