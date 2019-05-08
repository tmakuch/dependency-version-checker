module.exports = drawTable;

function drawTable({headers, data}) {
    const columns = getColumns(data.concat(headers));
    console.log(getLine(columns, headers));
    console.log(getLine(columns, {}, "="));
    data.forEach(entry => console.log(getLine(columns, entry)));
}

function getLine(columns, entry, padding = " ", delimiter = "  ") {
    return Object.entries(columns).reduce((result, [propName, length]) => {
        const propValue = getSafePropVal(entry[propName]);
        return result + propValue.padEnd(length, padding) + delimiter;
    }, "");
}

function getColumns(array) {
    return array.reduce((columns, nextEntry) => {
        Object.keys(nextEntry).forEach(propName => {
            const propVal = getSafePropVal(nextEntry[propName]);
            columns[propName] = Math.max(propVal.length, columns[propName] || 0);
        });
        return columns;
    }, {})
}

function getSafePropVal(propVal) {
    if (propVal === undefined) {
        return "";
    }

    if (propVal === null) {
        return "-";
    }

    return propVal.toString();
}