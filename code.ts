const localStyles = figma.getLocalPaintStyles()
const lightStyleMap = {
  'dark': 'light',
  'Dark': 'Light',
}
const darkStyleMap = {
  'light': 'dark',
  'Light': 'Dark',
}
let mode = undefined
let teamStyles = []

async function main() {
  if (figma.command == 'light') {
    mode = 'Light'
  } else if (figma.command == 'dark') {
    mode = 'Dark'
  } else if (figma.command == 'saveFromTeamLibrary') {
    const succeeded = await getTeamLibraryColors()
    return figma.closePlugin(succeeded ? 'Style saved' : 'This document does not have styles')
  } else {
    figma.closePlugin()
  }

  try {
    teamStyles = await fetchTeamStylesFromStorage()
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

async function getTeamLibraryColors() {
  if (figma.getLocalPaintStyles().length != 0) {
    await figma.clientStorage.setAsync('darkModeSwitcher.teamColorKeys', figma.getLocalPaintStyles().map(a => a.key))
    return true
  }
  return false
}

function replaceNodes(nodes: Array<any>): void {
  for (const node of nodes) {
    const fillStyleName: string = getPaintStyleNameByNode(node.fillStyleId)
    const strokeStyleName: string = getPaintStyleNameByNode(node.strokeStyleId)
    if (fillStyleName != null) {
      const replacedColorStyleName: string = replaceColorStyleName(fillStyleName)
      const replacedFillStyleId: string = getStyleIdByName(replacedColorStyleName)
      node.fillStyleId = replacedFillStyleId
    }

    if (strokeStyleName != null) {
      const replacedStrokeColorStyleName: string = replaceColorStyleName(strokeStyleName)
      const replacedStrokeStyleId: string = getStyleIdByName(replacedStrokeColorStyleName)
      node.strokeStyleId = replacedStrokeStyleId
    }

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      replaceNodes(node.children)
    }
  }
}

function getPaintStyleNameByNode(currentStyleId: string): string {
  let style = localStyles.find(style => style.id == currentStyleId)
  if (style != undefined) {
    return style.name
  }

  style = teamStyles.find(style => style.id == currentStyleId)
  return (style != undefined) ? style.name : null
}

function replaceColorStyleName(paintStyleName: string): string {
  const splitPaintStyleName = paintStyleName.split('/')
  const replacedNodePaintStyleNames = []

  for (let i = 0; i < splitPaintStyleName.length; i++) {
    let name = splitPaintStyleName[i]
    if (mode == 'Light' && lightStyleMap[name] != undefined) {
      replacedNodePaintStyleNames.push(lightStyleMap[name])
    } else if (mode == 'Dark' && darkStyleMap[name] != undefined) {
      replacedNodePaintStyleNames.push(darkStyleMap[name])
    } else {
      replacedNodePaintStyleNames.push(name)
    }
  }
  return replacedNodePaintStyleNames.join('/')
}

function getStyleIdByName(replacedColorStyleName: string): string {
  let style = localStyles.find(style => style.name == replacedColorStyleName)
  if (style != undefined) {
    return style.id
  }

  style = teamStyles.find(style => style.name == replacedColorStyleName)
  return (style != undefined) ? style.id : null
}

async function fetchTeamStylesFromStorage(): Promise<Array<BaseStyle>> {
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

main()
