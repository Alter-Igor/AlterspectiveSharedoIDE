export function strToClass(className, base) {
    const classParts = className.split('.');
    let classReference = base;
    for (const part of classParts) {
        if (!classReference[part]) {
            return undefined;
        }
        classReference = classReference[part];
    }
    ;
    return classReference;
}
