const { execSync } = require('child_process');
const readline = require('readline');

// ANSI Escape Codes for formatting console output
const styles = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const logger = {
    error: msg =>
        console.error(
            `${styles.red}${styles.bold}Error:${styles.reset} ${styles.red}${msg}${styles.reset}`
        ),
    warn: msg =>
        console.warn(
            `${styles.yellow}${styles.bold}Warning:${styles.reset} ${styles.yellow}${msg}${styles.reset}`
        ),
    info: msg => console.log(`${styles.cyan}${msg}${styles.reset}`),
    success: msg => console.log(`${styles.green}${styles.bold}${msg}${styles.reset}`),
    header: msg => console.log(`\n${styles.blue}${styles.bold}--- ${msg} ---${styles.reset}`),
    prompt: msg => `${styles.cyan}${styles.bold}${msg}${styles.reset}`,
    dim: msg => `${styles.dim}${msg}${styles.reset}`
};

// 1. 校验当前是否在 master 分支
try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'master') {
        logger.error(`此脚本只能在 master 分支上运行！当前分支为：${currentBranch}`);
        process.exit(1);
    }
} catch (e) {
    logger.error('无法获取当前 Git 分支名，请确保在 Git 仓库下运行此脚本。');
    process.exit(1);
}

// 2. 校验工作区是否干净 (确保 CHANGELOG.md 等修改已被提交)
try {
    const status = execSync('git status --porcelain').toString().trim();
    if (status) {
        logger.error('当前工作区有未提交的修改，请先提交（特别是 CHANGELOG.md）并推送到远程！');
        console.error(logger.dim(status));
        process.exit(1);
    }
} catch (e) {
    logger.error('无法获取 Git 工作区状态，请确保在 Git 仓库下运行此脚本。');
    process.exit(1);
}

// 3. 校验本地 master 是否与远程 master 保持一致
console.log(`${styles.cyan}正在从远程仓库获取最新状态 (git fetch origin master)...${styles.reset}`);
try {
    execSync('git fetch origin master', { stdio: 'ignore' });
} catch (e) {
    logger.warn('无法连接到远程仓库或获取远程分支失败，将跳过远程分支校验。');
}

try {
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse origin/master').toString().trim();
    if (localCommit !== remoteCommit) {
        logger.error('本地 master 分支与远程 origin/master 不一致！');
        console.error(`  本地提交: ${styles.dim}${localCommit}${styles.reset}`);
        console.error(`  远程提交: ${styles.dim}${remoteCommit}${styles.reset}`);
        console.error(
            `  提示: 请先执行 ${styles.bold}git push${styles.reset} 或 ${styles.bold}git pull${styles.reset}，确保分支一致后再进行发布。`
        );
        process.exit(1);
    }
} catch (e) {
    logger.warn('校验本地与远程分支一致性失败，可能是因为不存在 origin/master。');
}

// 4. 列出最近的 5 个 Tag
try {
    const recentTags = execSync('git tag --sort=creatordate | tail -n 5').toString().trim();
    logger.header('最近的 5 个 Tag');
    if (recentTags) {
        console.log(
            recentTags
                .split('\n')
                .map(t => `  - ${styles.cyan}${t}${styles.reset}`)
                .join('\n')
        );
    } else {
        console.log(`  ${styles.dim}（暂无历史 Tag）${styles.reset}`);
    }
    console.log(`${styles.dim}------------------------${styles.reset}\n`);
} catch (e) {
    // 容错：如果读取 Tag 失败，继续后续逻辑而不崩溃
}

// 5. 获取用户本次想要打的 Tag 号
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(logger.prompt('请输入要发布的最新 Tag 号: '), input => {
    const tagVersion = input.trim();
    if (!tagVersion) {
        logger.error('Tag 号不能为空！');
        rl.close();
        process.exit(1);
    }
    rl.close();
    startRelease(tagVersion);
});

function startRelease(tagVersion) {
    try {
        console.log(
            `\n${styles.cyan}正在打版本 Tag: ${styles.bold}${tagVersion}${styles.reset}${styles.cyan}...${styles.reset}`
        );
        execSync(`git tag ${tagVersion}`, { stdio: 'inherit' });

        console.log(
            `${styles.cyan}正在将 Tag: [${styles.bold}${tagVersion}${styles.reset}${styles.cyan}] 推送到远程仓库...${styles.reset}`
        );
        execSync(`git push origin ${tagVersion}`, { stdio: 'inherit' });

        logger.success(`\n发布和推送已全部完成！Tag: ${tagVersion}`);
    } catch (error) {
        logger.error('执行失败，已终止操作。');
        process.exit(1);
    }
}
