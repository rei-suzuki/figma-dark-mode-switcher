var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const localStyles = figma.getLocalPaintStyles();
const lightStyleMap = {
    'dark': 'light',
    'Dark': 'Light',
};
const darkStyleMap = {
    'light': 'dark',
    'Light': 'Dark',
};
let mode = undefined;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (figma.command == 'light') {
            mode = 'Light';
        }
        else if (figma.command == 'dark') {
            mode = 'Dark';
        }
        else if (figma.command == 'saveFromTeamLibrary') {
            const succeeded = yield getTeamLibraryColors();
            return figma.closePlugin(succeeded ? 'Style saved' : 'This document does not have styles');
        }
        else {
            figma.closePlugin();
        }
        try {
            for (let i = 0; i < figma.currentPage.selection.length; i++) {
                replaceNodes([figma.currentPage.selection[i]]);
            }
        }
        catch (e) {
            const error = e.toString();
            return figma.closePlugin(error);
        }
        figma.closePlugin();
    });
}
function getTeamLibraryColors() {
    return __awaiter(this, void 0, void 0, function* () {
        if (figma.getLocalPaintStyles().length != 0) {
            yield figma.clientStorage.setAsync('darkModeSwitcher.teamColorKeys', figma.getLocalPaintStyles().map(a => a.key));
            return true;
        }
        return false;
    });
}
function replaceNodes(nodes) {
    for (const node of nodes) {
        const fillStyleName = getPaintStyleNameByNode(node.fillStyleId);
        const strokeStyleName = getPaintStyleNameByNode(node.strokeStyleId);
        if (fillStyleName != null) {
            const replacedColorStyleName = changeReplaceColorStyleName(fillStyleName);
            const replacedFillStyleId = getStyleIdByName(replacedColorStyleName);
            node.fillStyleId = replacedFillStyleId;
        }
        if (strokeStyleName != null) {
            const replacedStrokeColorStyleName = changeReplaceColorStyleName(strokeStyleName);
            const replacedStrokeStyleId = getStyleIdByName(replacedStrokeColorStyleName);
            node.strokeStyleId = replacedStrokeStyleId;
        }
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
            replaceNodes(node.children);
        }
    }
}
function getPaintStyleNameByNode(currentStyleId) {
    const style = localStyles.find(style => style.id == currentStyleId);
    return (style != undefined) ? style.name : null;
}
function changeReplaceColorStyleName(paintStyleName) {
    const splitPaintStyleName = paintStyleName.split('/');
    const replacedNodePaintStyleName = [];
    for (let i = 0; i < splitPaintStyleName.length; i++) {
        let name = splitPaintStyleName[i];
        if (mode == 'Light' && lightStyleMap[name] != undefined) {
            replacedNodePaintStyleName.push(lightStyleMap[name]);
        }
        else if (mode == 'Dark' && darkStyleMap[name] != undefined) {
            replacedNodePaintStyleName.push(darkStyleMap[name]);
        }
        else {
            replacedNodePaintStyleName.push(name);
        }
    }
    return replacedNodePaintStyleName.join('/');
}
function getStyleIdByName(replacedColorStyleName) {
    const style = localStyles.find(style => style.name == replacedColorStyleName);
    return (style != undefined) ? style.id : null;
}
main();
