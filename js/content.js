import { round, score } from './score.js';
import { resetList } from './pages/List.js';
import { resetLeaderboard } from './pages/Leaderboard.js';
import { resetPacks } from './pages/ListPacks.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';
var theList = "dl"


// Thing at the beginning of the file name to signify that the level is pending
const pendingMark = "(p)_";

export async function fetchList() {
    const listResult = await fetch(`${dir}/${theList}/_list.json`);
    const packResult = await fetch(`${dir}/${theList}/_packlist.json`);

    try {
        const list = await listResult.json();
        const packsList = await packResult.json();

        // Create a lookup dictionary for ranks
        const ranksEntries = list
            .filter((path) => !path.startsWith(pendingMark))
            .map((path, index) => [path, index + 1]);
        const ranks = Object.fromEntries(ranksEntries);

        return await Promise.all(
            list.map(async (path) => {
                const rank = ranks[path] || null;
                try {
                    const levelResult = await fetch(`${dir}/${theList}/${path.startsWith(pendingMark) ? path.substring(4) : path}.json`);
                    const level = await levelResult.json();
                    let packs = packsList.filter((x) =>
                        x.levels.includes(path)
                    );
                    return [
                        null,
                        rank,
                        {
                            ...level,
                            rank,
                            packs,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank} ${path}.`);
                    return [path, rank, null];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const packResult = await (await fetch(`${dir}/${theList}/_packlist.json`)).json();
    const scoreMap = {};
    const errs = [];

    if (list === null) {
        return [null, ["Failed to load list."]];
    }

    list.forEach(([err, rank, level]) => {
        if (err) {
            errs.push(err);
            return;
        }

        if (rank === null) {
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
            packs: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank,
            level: level.name,
            score: score(rank, 100, level.percentToQualify) * 1.1,
            link: level.verification,
            path: level.path
        });

        // Records
        level.records.forEach((record, index) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
                path: level.path
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank,
                    level: level.name,
                    score:
                        index < 2
                            ? score(rank, 100, level.percentToQualify) * 1.1
                            : score(rank, 100, level.percentToQualify),
                    link: record.link,
                    path: level.path,
                });
                return;
            }

            progressed.push({
                rank: rank,
                level: level.name,
                percent: record.percent,
                score: score(rank, record.percent, level.percentToQualify),
                link: record.link,
                path: level.path
            });
        });
    });

    for (let user of Object.entries(scoreMap)) {
        let levels = [...user[1]["verified"], ...user[1]["completed"]].map(
            (x) => x["path"]
        );

        for (let pack of packResult) {
            if (pack.levels.every((e1) => levels.includes(e1))) {
                user[1]["packs"].push(pack);
            }
        }
    }

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    console.log(scoreMap)
    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const packResult = await fetch(`${dir}/${theList}/_packlist.json`);
        const packsList = await packResult.json();
        return packsList;
    } catch {
        return null;
    }
}

export async function fetchPackLevels(packname) {
    const packResult = await fetch(`${dir}/${theList}/_packlist.json`);
    const packsList = await packResult.json();
    const selectedPack = await packsList.find((pack) => pack.name == packname);
    const listResult = await await fetch(`${dir}/${theList}/_list.json`);
    try {
        const list = await listResult.json();

        // Create a lookup dictionary for ranks
        const ranksEntries = list
            .filter((path) => !path.startsWith(pendingMark))
            .map((path, index) => [path, index + 1]);
        const ranks = Object.fromEntries(ranksEntries);

        return await Promise.all(
            selectedPack.levels.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${theList}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    const listRank = ranks[path] || null;
                    return [
                        {
                            level,
                            listRank,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank} ${path} (${packname}).`);
                    return [path, rank, null];
                }
            })
        );
    } catch (e) {
        console.error(`Failed to load packs.`, e);
        return null;
    }
}

export async function changeList(){
    theList = document.getElementById("list_dropdown").value;
    console.log("theList: " + theList.toString() + ", dropdown value: " + document.getElementById("list_dropdown").value.toString());
    resetList();
    resetLeaderboard();
    resetPacks();
}