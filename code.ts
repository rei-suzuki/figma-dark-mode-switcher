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
    const name: string = getPaintStyleNameByNode(node.fillStyleId)
    if (name != null) {
      const replacedColorStyleName: string = changeReplaceColorStyleName(name)
      const replacedFillStyleId: string = getFillStyleIdByName(replacedColorStyleName)
      node.fillStyleId = replacedFillStyleId
    }

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      replaceNodes(node.children)
    }
  }
}

function getPaintStyleNameByNode(currentFillStyleId: string): string {
  const style = localStyles.find(style => style.id == currentFillStyleId)
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

function getFillStyleIdByName(replacedColorStyleName: string): string {
  const style = localStyles.find(style => style.name == replacedColorStyleName)
  return (style != undefined) ? style.id : null
}

main()
