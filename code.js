var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const localStyles = figma.getLocalPaintStyles();
const Mode = {
    Dark: 'dark',
    Light: 'light',
};
let mode = undefined;
let teamStyles = [];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (figma.command == 'light') {
            mode = Mode.Light;
        }
        else if (figma.command == 'dark') {
            mode = Mode.Dark;
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
        if (isModeKeyword(name)) {
            replacedNodePaintStyleNames.push(switchMode(capitalized(name)));
        }
        else {
            replacedNodePaintStyleNames.push(name);
        }
    }
    return replacedNodePaintStyleNames.join('/');
}
function isModeKeyword(name) {
    const found = Object.keys(Mode).find((mode) => mode.toLowerCase() === name.toLowerCase());
    return (found != undefined);
}
function switchMode(capitalized) {
    if (capitalized) {
        return capitalize(mode);
    }
    return mode;
}
function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.toLowerCase().slice(1);
}
function capitalized(name) {
    return (name === capitalize(name));
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
            console.log("The team colors were not found. Please run 'save' on the styles page before run any replace commands.");
            return [];
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
