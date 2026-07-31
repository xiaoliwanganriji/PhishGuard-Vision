// Levenshtein 相似度：使用滚动数组降内存，时间 O(m*n)
// 同时做长度剪枝，长度差 > MAX_DIFF 时直接返回 0
(function () {
const MAX_DIFF = 4;

function levenshteinRatio(a, b) {
    if (a === b) return 1;
    const A = a.toLowerCase();
    const B = b.toLowerCase();
    const m = A.length, n = B.length;
    if (Math.abs(m - n) > MAX_DIFF) return 0;
    if (m === 0 || n === 0) return 0;

    let prev = new Array(n + 1);
    let curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = A[i - 1] === B[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost
            );
        }
        [prev, curr] = [curr, prev];
    }
    const maxLen = Math.max(m, n);
    return 1 - prev[n] / maxLen;
}

// 通用导出
if (typeof module !== "undefined" && module.exports) {
    module.exports = { levenshteinRatio };
}
if (typeof self !== "undefined") {
    self.levenshteinRatio = levenshteinRatio;
}
})();
