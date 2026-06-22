const { execSync } = require('child_process');
const readline = require('readline');

// 1. 校验当前是否在 master 分支
try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'master') {
        console.error('❌ 错误：此脚本只能在 master 分支上运行！当前分支为：' + currentBranch);
        process.exit(1);
    }
} catch (e) {
    console.error('❌ 无法获取当前 Git 分支名，请确保在 Git 仓库下运行此脚本。');
    process.exit(1);
}

// 2. 校验工作区是否干净 (确保 CHANGELOG.md 等修改已被提交)
try {
    const status = execSync('git status --porcelain').toString().trim();
    if (status) {
        console.error('❌ 错误：当前工作区有未提交的修改，请先提交并推送到远程！');
        console.error(status);
        process.exit(1);
    }
} catch (e) {
    console.error('❌ 无法获取 Git 工作区状态，请确保在 Git 仓库下运行此脚本。');
    process.exit(1);
}

// 3. 校验本地 master 是否与远程 master 保持一致
console.log('🔄 正在从远程仓库获取最新状态 (git fetch origin master)...');
try {
    execSync('git fetch origin master', { stdio: 'ignore' });
} catch (e) {
    console.warn('⚠️  警告：无法连接到远程仓库或获取远程分支失败，将跳过远程分支校验。');
}

try {
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse origin/master').toString().trim();
    if (localCommit !== remoteCommit) {
        console.error('❌ 错误：本地 master 分支与远程 origin/master 不一致！');
        console.error(`  本地提交: ${localCommit}`);
        console.error(`  远程提交: ${remoteCommit}`);
        console.error('👉 请先执行 git push 或 git pull，确保分支一致后再进行发布。');
        process.exit(1);
    }
} catch (e) {
    console.warn('⚠️  警告：校验本地与远程分支一致性失败，可能是因为不存在 origin/master。');
}

// 4. 列出最近的 5 个 Tag
try {
    const recentTags = execSync('git tag --sort=creatordate | tail -n 5').toString().trim();
    console.log('\n📌 最近的 5 个 Tag：');
    if (recentTags) {
        console.log(
            recentTags
                .split('\n')
                .map(t => `  - ${t}`)
                .join('\n')
        );
    } else {
        console.log('  （暂无历史 Tag）');
    }
    console.log('------------------------\n');
} catch (e) {
    // 容错：如果读取 Tag 失败，继续后续逻辑而不崩溃
}

// 5. 获取用户本次想要打的 Tag 号
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('🏷️  请输入要发布的最新 Tag 号: ', input => {
    const tagVersion = input.trim();
    if (!tagVersion) {
        console.error('❌ 错误：Tag 号不能为空！');
        rl.close();
        process.exit(1);
    }
    rl.close();
    startRelease(tagVersion);
});

function startRelease(tagVersion) {
    try {
        console.log(`🏷️  正在打版本 Tag: ${tagVersion}...`);
        execSync(`git tag ${tagVersion}`, { stdio: 'inherit' });

        console.log(`🚀 正在将 Tag: [${tagVersion}] 推送到远程仓库...`);
        execSync(`git push origin ${tagVersion}`, { stdio: 'inherit' });

        console.log(`\n🎉 发布和推送已全部完成！Tag: ${tagVersion}`);
    } catch (error) {
        console.error('❌ 执行失败，已终止操作。');
        process.exit(1);
    }
}
