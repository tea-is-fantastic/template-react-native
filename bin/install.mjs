#!/usr/bin/env node

import { execSync} from 'child_process'
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv))
    .usage('Usage: npx @tisf/git <cmd> <url> [path] [options]')
    .command('$0 <cmd> <url> [path]', 't', (yargs) => {
        yargs.positional('cmd', {
            describe: 'Command',
            type: 'string'
        })
        yargs.positional('url', {
            describe: 'Url of file to download',
            type: 'string'
        })
        yargs.positional('path', {
            describe: 'Path to download file to',
            type: 'string'
        })
    })
    .options({
        m: {
            default: "Commit",
            describe: 'Message (default: Commit)',
            type: 'string'
        }
    })
    .help('h')
    .demandCommand(1)
    .parse()

const forceDownload = async (pth, force) => {
    try {
        if (force) return true
        const stats = await fs.promises.stat(pth);
        console.log(stats);
        if (stats.isDirectory() && fs.readdirSync(pth).length != 0) {
            return false;
        } else if (stats.isFile() && stats.size > 0) {
            return false;
        }
        return true
    } catch (error) {
        return true;
    }
}

const downloadRepo = async (nurl, fpth, force) => {
    try {
        console.log(nurl)
        console.log(fpth)

        const f = await forceDownload(fpth, force);
        console.log(f);

        if (!f) return
        await fs.promises.rm(fpth, { recursive: true, force: true });
        const c = `git clone ${nurl} ${fpth}`
        console.log(c)
        console.log("aaaaaaaaaaaaaaaaa")
        const output = execSync(c, { 
            stdio: 'inherit'
         });
        console.log(`download ${nurl} successful`);
    } catch (error) {
        console.error('download pipeline failed', error);
    }
}

(async () => {
    const cmd = argv.cmd;
    const url = argv.url;
    const pth = argv.path;
    const force = argv.f;
    const msg = argv.m;
    let nurl = `https://github.com/${url}`
    if (!url.includes("/")) {
        nurl = `https://github.com/t-i-f/${url}`
    }

    const fname = path.basename((new URL(nurl)).pathname);
    let fpth = path.resolve(process.cwd())
    if (pth) {
        fpth = path.resolve(process.cwd(), pth)
    }
    const rpth = path.resolve(fpth, fname)
    const gurl = `git@github.com:${url}.git`

    // let fpth = path.resolve(process.cwd(), pth || ""); // Ensure correct base path
    // const repoName = path.basename(new URL(nurl).pathname);
    // const rpth = pth ? fpth : path.resolve(fpth, repoName); // Avoid double nesting

    console.log(cmd, url, pth, force, fpth, rpth)

    if (cmd === "push") {
        execSync(`cd '${fpth}' && git add -A && git commit --no-verify -am "woohoo" && git push --all`)
    } else if (cmd === "refresh") {
        execSync(`cd '${fpth}' && rm -rf .git && git init . && git add -A && git commit --no-verify -am "${msg}" && git branch -M main && git remote add origin ${gurl} && git push --all -f`)
    } else if (cmd === "publish") {
        execSync(`cd '${fpth}' && git add -A && git commit --no-verify -am "${msg}" && npm version patch && npm publish --access=public && git push --all`)
    } else if (cmd === "clone") {
        await downloadRepo(nurl, rpth, force)
    }
})();
