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
let teamStyles = [];
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
            teamStyles = yield fetchTeamStylesFromStorage();
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
            const replacedColorStyleName = replaceColorStyleName(fillStyleName);
            const replacedFillStyleId = getStyleIdByName(replacedColorStyleName);
            node.fillStyleId = replacedFillStyleId;
        }
        if (strokeStyleName != null) {
            const replacedStrokeColorStyleName = replaceColorStyleName(strokeStyleName);
            const replacedStrokeStyleId = getStyleIdByName(replacedStrokeColorStyleName);
            node.strokeStyleId = replacedStrokeStyleId;
        }
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
            replaceNodes(node.children);
        }
    }
}
function getPaintStyleNameByNode(currentStyleId) {
    let style = localStyles.find(style => style.id == currentStyleId);
    if (style != undefined) {
        return style.name;
    }
    style = teamStyles.find(style => style.id == currentStyleId);
    return (style != undefined) ? style.name : null;
}
function replaceColorStyleName(paintStyleName) {
    const splitPaintStyleName = paintStyleName.split('/');
    const replacedNodePaintStyleNames = [];
    for (let i = 0; i < splitPaintStyleName.length; i++) {
        let name = splitPaintStyleName[i];
        if (mode == 'Light' && lightStyleMap[name] != undefined) {
            replacedNodePaintStyleNames.push(lightStyleMap[name]);
        }
        else if (mode == 'Dark' && darkStyleMap[name] != undefined) {
            replacedNodePaintStyleNames.push(darkStyleMap[name]);
        }
        else {
            replacedNodePaintStyleNames.push(name);
        }
    }
    return replacedNodePaintStyleNames.join('/');
}
function getStyleIdByName(replacedColorStyleName) {
    let style = localStyles.find(style => style.name == replacedColorStyleName);
    if (style != undefined) {
        return style.id;
    }
    style = teamStyles.find(style => style.name == replacedColorStyleName);
    return (style != undefined) ? style.id : null;
}
function fetchTeamStylesFromStorage() {
    return __awaiter(this, void 0, void 0, function* () {
        const teamColorKeys = yield figma.clientStorage.getAsync('darkModeSwitcher.teamColorKeys');
        if (!teamColorKeys) {
            throw new Error("The team colors were not found. Please run 'save' on the styles page before run any replace commands.");
        }
        const teamStyles = [];
        for (let key of teamColorKeys) {
            const style = yield figma.importStyleByKeyAsync(key);
            if (style) {
                teamStyles.push(style);
            }
        }
        return teamStyles;
    });
}
main();
