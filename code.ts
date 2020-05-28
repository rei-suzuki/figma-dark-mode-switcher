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

function main() {
  if (figma.command == 'light') {
    mode = 'Light'
  } else if (figma.command == 'dark') {
    mode = 'Dark'
  } else {
    figma.closePlugin()
  }

  try {
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
    const fillStyleName: string = getPaintStyleNameByNode(node.fillStyleId)
    const strokeStyleName: string = getPaintStyleNameByNode(node.strokeStyleId)
    if (fillStyleName != null) {
      const replacedColorStyleName: string = changeReplaceColorStyleName(fillStyleName)
      const replacedFillStyleId: string = getStyleIdByName(replacedColorStyleName)
      node.fillStyleId = replacedFillStyleId
    }

    if (strokeStyleName != null) {
      const replacedStrokeColorStyleName: string = changeReplaceColorStyleName(strokeStyleName)
      const replacedStrokeStyleId: string = getStyleIdByName(replacedStrokeColorStyleName)
      node.strokeStyleId = replacedStrokeStyleId
    }

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      replaceNodes(node.children)
    }
  }
}

function getPaintStyleNameByNode(currentStyleId: string): string {
  const style = localStyles.find(style => style.id == currentStyleId)
  return (style != undefined) ? style.name : null
}

function changeReplaceColorStyleName(paintStyleName: string): string {
  const splitPaintStyleName = paintStyleName.split('/')
  const replacedNodePaintStyleName = []

  for (let i = 0; i < splitPaintStyleName.length; i++) {
    let name = splitPaintStyleName[i]
    if (mode == 'Light' && lightStyleMap[name] != undefined) {
      replacedNodePaintStyleName.push(lightStyleMap[name])
    } else if (mode == 'Dark' && darkStyleMap[name] != undefined) {
      replacedNodePaintStyleName.push(darkStyleMap[name])
    } else {
      replacedNodePaintStyleName.push(name)
    }
  }
  return replacedNodePaintStyleName.join('/')
}

function getStyleIdByName(replacedColorStyleName: string): string {
  const style = localStyles.find(style => style.name == replacedColorStyleName)
  return (style != undefined) ? style.id : null
}

main()
