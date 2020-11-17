var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Mode = {
    Dark: 'dark',
    Light: 'light',
    Elevated: 'elevated',
};
let mode = undefined;
const localStyles = figma.getLocalPaintStyles();
let teamStyles = [];
let styleManager = undefined;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (Object.keys(Mode).find(key => Mode[key] === figma.command) != undefined) {
            mode = figma.command;
        }
        else if (figma.command == 'saveFromTeamLibrary') {
            const succeeded = yield TeamColorsManager.saveTeamStyleKeysToStorage();
            return figma.closePlugin(succeeded ? 'Style saved' : 'This document does not have styles');
        }
        else {
            figma.closePlugin();
        }
        try {
            teamStyles = yield TeamColorsManager.loadTeamStylesFromStorage();
            styleManager = new StyleManager([...localStyles, ...teamStyles]);
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
function replaceNodes(nodes) {
    for (const node of nodes) {
        const fillStyleName = styleManager.getStyleNameById(node.fillStyleId);
        const strokeStyleName = styleManager.getStyleNameById(node.strokeStyleId);
        if (fillStyleName != null) {
            const replacedColorStyleName = replaceColorStyleName(fillStyleName);
            const replacedFillStyleId = styleManager.getStyleIdByName(replacedColorStyleName);
            node.fillStyleId = replacedFillStyleId;
        }
        if (strokeStyleName != null) {
            const replacedStrokeColorStyleName = replaceColorStyleName(strokeStyleName);
            const replacedStrokeStyleId = styleManager.getStyleIdByName(replacedStrokeColorStyleName);
            node.strokeStyleId = replacedStrokeStyleId;
        }
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
            replaceNodes(node.children);
        }
    }
}
function replaceColorStyleName(paintStyleName) {
    const splitPaintStyleName = paintStyleName.split('/');
    const replacedNodePaintStyleNames = [];
    for (let i = 0; i < splitPaintStyleName.length; i++) {
        const name = new StyleKeyword(splitPaintStyleName[i], mode);
        replacedNodePaintStyleNames.push(name.switch());
    }
    return replacedNodePaintStyleNames.join('/');
}
class TeamColorsManager {
    static saveTeamStyleKeysToStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (figma.getLocalPaintStyles().length != 0) {
                yield figma.clientStorage.setAsync(this.key, figma.getLocalPaintStyles().map(a => a.key));
                return true;
            }
            return false;
        });
    }
    static loadTeamStylesFromStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            const teamColorKeys = yield figma.clientStorage.getAsync(this.key);
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
}
TeamColorsManager.key = "darkModeSwitcher.teamColorKeys";
class StyleManager {
    constructor(styles) {
        this.styles = styles;
    }
    getStyleNameById(currentStyleId) {
        let style = this.styles.find(style => style.id == currentStyleId);
        return (style != undefined) ? style.name : null;
    }
    getStyleIdByName(replacedColorStyleName) {
        let style = this.styles.find(style => style.name == replacedColorStyleName);
        return (style != undefined) ? style.id : null;
    }
}
class StyleKeyword {
    constructor(name, mode) {
        this.name = name;
        this.mode = mode;
    }
    switch() {
        if (!this.isModeKeyword) {
            return this.name;
        }
        if (this.capitalized(this.name)) {
            return this.capitalize(this.mode);
        }
        return this.mode;
    }
    get isModeKeyword() {
        const found = Object.keys(Mode).find((mode) => mode.toLowerCase() === this.name.toLowerCase());
        return (found != undefined);
    }
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.toLowerCase().slice(1);
    }
    capitalized(text) {
        return (text === this.capitalize(text));
    }
}
main();
