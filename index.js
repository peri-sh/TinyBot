const Discord = require('discord.js');
const osu = require('node-osu');
const {Beatmap, Osu: {DifficultyCalculator, PerformanceCalculator}} = require('osu-bpdpc')
const request = require('request-promise-native')

const bot = new Discord.Client();

var cache = [{"username":"292523841811513348","osuname":"Tienei"},{"username":"413613781793636352","osuname":"yazzymonkey"},{"username":"175179081397043200","osuname":"pykemis"},{"username":"253376598353379328","osuname":"jpg"},{"username":"183918990446428160","osuname":"Pillows"}]
var storedmapid = []

var osuApi = new osu.Api('70095e8e72a161b213c44dfb47b44daf258c70bb', {
    notFoundAsError: false,
    completeScores: true
});

bot.on('message', (message) => {

    var msg = message.content.toLowerCase();

    if (message.author.bot == false){

        //Normal bot stuff

        if (msg.substring(0,4) == '!hug') {
            message.channel.send(`${message.author.username} just gave a hug for ${message.content.substring(5)}! <:toblerone:431170906572849153>`)
        }

        if (msg.substring(0,5) == '!bake') {
            message.channel.send(`${message.author.username} just baked a cookie for ${message.content.substring(6)}! <:pika:433607174779043840>`)
        }

        if (msg.substring(0,5) == '!roll') {
            var roll = Math.floor((Math.random() * 100) + 1);
            message.channel.send(`${message.author.username} rolled ${roll} points :game_die:`);
        }

        if (msg.substring(0,7) == '!potato') {
            message.channel.send(`${message.author.username} just gave a potato for ${message.content.substring(5)}! :potato:`)
        }

        if (msg.substring(0,5) == '!make') {
            var i = worddetection(6,msg,'@','+').position
            message.channel.send(`${message.author.username} just made ${message.content.substring(6,i-1)}for${message.content.substring(i-2, message.content.length)} !`)
        }

        if (msg.substring(0,5) == '!help') {
            message.channel.send(`
Tiny bot command:
// [Normal stuff]
!bake (username): Bake anyone cookie [You can use !make instead of this]
!potato (username): Give anyone potato [You can use !make instead of this]
!make (something, username): Make anyone something
!hug (username): Hug anyone
!roll: Roll your fate
!help: Open help command
!check: [FOR TINY ONLY!] Force him to save data in a lazy way uwu
// [osu!]
!osu (username): Check user osu status
!taiko (username): Check user taiko status
!ctb (username): Check user ctb status
!mania (username): Check user mania status
!recent (username): Check user most recent play
!compare (username): Compare with other!
!osutop (username,number[1-100]): Check your top best 100 play!`, {code:"css"})
        }

        // Osu related

        function worddetection(startingword,word,untilword,order) {
            if (order == '+') {
                var i = startingword
                var char = '1'
                do {
                    i = i + 1
                    char = word.substr(i,1)
                    if (i > 200) {
                        char = untilword
                    }
                }
                while (char !== untilword);

                return {word:word.substring(startingword,i),position:i}
            }
            if (order == '-') {
                var i = startingword
                var char = '1'
                do {
                    i = i - 1
                    char = word.substr(i,1)
                    if (i > 200) {
                        char = untilword
                    }
                }
                while (char !== untilword);

                return {word:word.substring(i,startingword),position:i}
            }

        }

        function playerdetection(name) {
            if (name == '') {
                var osuname = ''
                var found = false
                for (var i = 0; i < cache.length; i++) {
                    if (cache[i].username == message.author.id) {
                        osuname = cache[i].osuname
                        found = true
                    }
                }
                if (found == false) {
                    return name;
                }
                return osuname;
            } else {
                return name;
            }
        }

        function moddetection(mod) {
            var mods = {
                NoFail     : "NF", NoFailBit: 1,
                Easy       : "EZ", EasyBit: 2,
                Hidden     : "HD", HiddenBit: 8,
                HardRock   : "HR", HardRockBit: 16,
                DoubleTime : "DT", DoubleTimeBit: 64,
                Relax      : "RX", RelaxBit: 128,
                HalfTime   : "HT", HalfTimeBit: 256,
                Nightcore  : "NC", NightcoreBit: 512,
                FlashLight : "FL", FlashLightBit: 1024
            }
            var shortenmod = '+';
            var bitpresent = 0
            for (var i = 0; i < mod.length; i++) {
                if (mods[mod[i]]) {
                    shortenmod += mods[mod[i]];
                    bitpresent += mods[mod[i] + "Bit"];
                }
            }
            if (mod.length == 0 || shortenmod == '+'){
                shortenmod += 'No Mod';
            }
            return {shortenmod: shortenmod, bitpresent: bitpresent}
        }

        async function ppandstarcalc(beatmapid,mods,combo,c300,c100,c50,cmiss) {
            var osu = await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)
            var beatmap = Beatmap.fromOsu(osu)
            var i = 0
            var object = 0
            do {
                i += 1
            }
            while (osu.substr(i,12) !== '[HitObjects]');
            for (var o = i+13; o < osu.length; o++) {
                if (osu.substr(o,1) == '\r') {
                    object += 1
                }
            }
            if (c300 == 0) {
                c300 = object - c100 - c50
            }
            var score = {
                maxcombo: combo,
                count50: c50,
                count100: c100,
                count300: c300,
                countMiss: cmiss,
                mods: mods
            }
            var diffCalc = DifficultyCalculator.use(beatmap).setMods(score.mods).calculate()
            var ppCalc = PerformanceCalculator.use(diffCalc).calculate(score)
            return {pp: Number(ppCalc.totalPerformance).toFixed(2), star: Number(diffCalc.starDifficulty).toFixed(1), object: object};
        }

        async function osu(name, mode, modename) {
                var user = await osuApi.apiCall('/get_user', {u: `${name}`, m: `${mode}`})
                if (user.length == 0) {
                    message.channel.send('Please enter a valid username or use !osuset to set your osu username **-Chino**')
                }
                var username = user[0].username
                var acc = Number(user[0].accuracy).toFixed(2)
                var id = user[0].user_id
                var pp = Math.round(user[0].pp_raw);
                var played = user[0].playcount
                var rank = user[0].pp_rank
                var countryrank = user[0].pp_country_rank
                var country = user[0].country.toLowerCase();
                var level = user[0].level
                var ss = Number(user[0].count_rank_ss) + Number(user[0].count_rank_ssh)
                var s = Number(user[0].count_rank_s) + Number(user[0].count_rank_sh)
                var a = user[0].count_rank_a

                const embed = new Discord.RichEmbed()
                .setTitle(`Osu!${modename} status for: ${username}`)
                .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
            
**SS:** ${ss}  **S:** ${s}  **A:** ${a} `)
                .setTimestamp()
                .setThumbnail(`http://s.ppy.sh/a/${id}.png`)
                .setColor('#7f7fff')

                message.channel.send({embed});
        }

        if (msg.substring(0,7) == '!osuset') {
            async function osuset () {
                var osuname = message.content.substring(8)
                var detected = false
                var user = await osuApi.getUser({u: `${osuname}`})
                var name = user.name
                if (name == undefined) {
                    message.channel.send('Please enter a valid osu username! >:c')
                } else {
                    for (var i = 0; i <= cache.length - 1; i++) {
                        if (cache.length <= 0) {
                            cache.push({"username":message.author.id,"osuname":osuname})
                        }
                        if (i < cache.length - 1) {
                            if (cache[i].username == message.author.id) {
                                cache[i].osuname = osuname
                                detected = true
                            }
                        }
                    }
                    if (detected == false) {
                        cache.push({"username":message.author.id,"osuname":osuname})
                    }
                    message.channel.send(`You account has been linked to osu! username **${osuname}**`) 
                }
            }
            osuset()
        }

        if (msg.substring(0,4) == '!osu' && msg.substring(0,7) !== '!osuset' && msg.substring(0,7) !== '!osutop') {
            var check = message.content.substring(5)
            var name = playerdetection(check)
            osu(name,0,'Standard')
        }

        if (msg.substring(0,6) == '!taiko') {
            var check = message.content.substring(7)
            var name = playerdetection(check)
            osu(name,1,'Taiko')
        }

        if (msg.substring(0,4) == '!ctb') {
            var check = message.content.substring(5)
            var name = playerdetection(check)
            osu(name,2,'Catch The Beat')
        }
        if (msg.substring(0,6) == '!mania') {
            var check = message.content.substring(7)
            var name = playerdetection(check)
            osu(name,3,'Mania')
        } 

        if (msg.substring(0,7) == '!recent') {
            async function recent() {
                var check = message.content.substring(8);
                var name = playerdetection(check)
                var recent = await osuApi.getUserRecent({u: `${name}`})
                if (recent.length == 0) {
                    message.channel.send('Please enter a valid username or use !osuset to set your osu username **-Chino**')
                }
                var getplayer = await osuApi.apiCall('/get_user', {u: `${name}`})
                var beatmapid = recent[0][1].id
                var map = await osuApi.apiCall('/get_beatmaps', {b: `${beatmapid}`})
                var scores = recent[0][0].score
                var userid = recent[0][0].user.id
                var beatmap = recent[0][1].title
                var diff = recent[0][1].version
                var count300 = Number(recent[0][0].counts['300'])
                var count100 = Number(recent[0][0].counts['100'])
                var count50 = Number(recent[0][0].counts['50'])
                var countmiss = Number(recent[0][0].counts.miss)
                var combo = recent[0][0].maxCombo   
                var fc = recent[0][1].maxCombo
                var mod = recent[0][0].mods
                var rank = recent[0][0].rank
                var perfect = recent[0][0].perfect
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var modandbit = moddetection(mod)
                var shortenmod = modandbit.shortenmod
                var bitpresent = modandbit.bitpresent
                var osuname = getplayer[0].username
                storedmapid.push(beatmapid)
                var beatmapidfixed = map[0].beatmapset_id
                var ppandstar = await ppandstarcalc(beatmapid,bitpresent,combo,count300,count100,count50,countmiss)
                var pp = ppandstar.pp
                var star = ppandstar.star
                var fcpp = await ppandstarcalc(beatmapid,bitpresent,fc,0,count100,count50,0)
                var fccount300 = fcpp.object - count100 - count50
                var fcacc = Number((300 * fccount300 + 100 * count100 + 50 * count50) / (300 * (fccount300 + count100 + count50)) * 100).toFixed(2)
                var fcguess = ``
                if (rank == 'F') {
                    pp = 'No PP'
                    fcguess = `[${fcpp.pp}PP for ${fcacc}% FC]`
                } else if (rank !== 'F' && perfect == 0) {
                    pp = pp
                    fcguess = `[${fcpp.pp}PP for ${fcacc}% FC]`
                } else {
                    pp = pp
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Most recent osu! Standard play for ${osuname}:`, `http://s.ppy.sh/a/${userid}.png`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor('#7f7fff')
                .setDescription(`
**${beatmap} [${diff}] ${shortenmod} (${star}★)**
▸ Scores: ${scores}
▸ **Rank: ${rank} ▸ Combo: ${combo}/${fc}** 
▸ **PP: ${pp}** ${fcguess}
▸ **Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`)
                message.channel.send({embed});
            }
            recent()
        }

        if (msg.substring(0,8) == '!compare') {
            async function compare() {
                var check = message.content.substring(9);
                var name = playerdetection(check)
                var scores = await osuApi.getScores({b: `${storedmapid[storedmapid.length - 1]}`, u: `${name}`})
                if (scores.length == 0) {
                    message.channel.send('Please enter a valid username or use !osuset to set your osu username **-Chino**')
                }
                var beatmap = await osuApi.getBeatmaps({b: `${storedmapid[storedmapid.length - 1]}`})
                var highscore = ''
                var beatmapname = beatmap[0].title
                var diff = beatmap[0].version
                var beatmapimageid = beatmap[0].beatmapSetId
                var star = 0
                var osuname = scores[0].user.name
                var osuid = scores[0].user.id
                for (var i = 0; i <= scores.length - 1; i++) {
                    var score = scores[i].score
                    var count300 = Number(scores[i].counts['300'])
                    var count100 = Number(scores[i].counts['100'])
                    var count50 = Number(scores[i].counts['50'])
                    var countmiss = Number(scores[i].counts.miss)
                    var combo = scores[i].maxCombo
                    var fc = beatmap[0].maxCombo
                    var rank = scores[i].rank
                    var mod = scores[i].mods
                    var perfect = scores[i].perfect
                    var modandbit = moddetection(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var pp = Number(scores[i].pp).toFixed(2)
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var fcppandstar = await ppandstarcalc(storedmapid[storedmapid.length - 1],bitpresent,fc,0,count100,count50,0)
                    star = fcppandstar.star
                    var fcpp = fcppandstar.pp
                    var fccount300 = fcppandstar.object - count100 - count50
                    var fcacc = Number((300 * fccount300 + 100 * count100 + 50 * count50) / (300 * (fccount300 + count100 + count50)) * 100).toFixed(2)
                    var fcguess = ``
                    if (perfect == 0) {
                        fcguess = `[${fcpp}PP for ${fcacc}% FC]`
                    }
                        highscore += `
${i+1}. **${shortenmod}** Score
▸ Score: ${score}
**▸ Rank: ${rank} ▸ Combo: ${combo}/${fc} ▸ PP: ${pp}** ${fcguess}
**▸ Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`
                        
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}] (${star}★)`, `http://s.ppy.sh/a/${osuid}.png`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
            }
            compare()
        }

        if (msg.substring(0,7) == '!osutop') {
            async function osutop() {
                var find1 = worddetection(8,msg,' ','+')
                var find2 = worddetection(find1.position,msg,' ','+')
                var name = ''
                var loop = 0
                var start = 0
                var find = false
                for (var i = 0; i <= 100; i++) {
                    if (Number(find2.word) == i+1) {
                        name = playerdetection(find1.word)
                        loop = i + 1
                        start = i
                        find = true
                        break;
                    } else if (Number(find1.word) == i+1) {
                        name = playerdetection('')
                        loop = i + 1
                        start = i
                        find = true
                        break;
                    } else if (find1.word == '!osutop') {
                        name = playerdetection('')
                        loop = 5
                        find = true
                        break;
                    }
                }
                if (find == false) {
                    name = playerdetection(find1.word)
                    loop = 5
                }
                var top = ''
                var best = await osuApi.getUserBest({u: `${name}`, limit: 100})
                if (best.length == 0) {
                    message.channel.send('Please enter a valid username or use !osuset to set your osu username **-Chino**')
                }
                var userid = best[0][0].user.id
                var user = await osuApi.getUser({u: `${userid}`})
                var username = user.name
                for (var i = start; i < loop; i++) {
                    var title = best[i][1].title
                    var diff = best[i][1].version
                    var beatmapid = best[i][1].id
                    var score = best[i][0].score
                    var count300 = Number(best[i][0].counts['300'])
                    var count100 = Number(best[i][0].counts['100'])
                    var count50 = Number(best[i][0].counts['50'])
                    var countmiss = Number(best[0][0].counts.miss)
                    var combo = best[i][0].maxCombo
                    var fc = best[i][1].maxCombo
                    var rank = best[i][0].rank
                    var pp = Number(best[i][0].pp).toFixed(2)
                    var mod = best[i][0].mods
                    var perfect = best[i][0].perfect
                    var modandbit = moddetection(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var fcppandstar = await ppandstarcalc(beatmapid,bitpresent,fc,0,count100,count50,0)
                    var fcpp = fcppandstar.pp
                    var star = fcppandstar.star
                    var fccount300 = fcppandstar.object - count100 - count50
                    var fcacc = Number((300 * fccount300 + 100 * count100 + 50 * count50) / (300 * (fccount300 + count100 + count50)) * 100).toFixed(2)
                    var fcguess = ``
                    if (perfect == 0) {
                        fcguess = `[${fcpp}PP for ${fcacc}% FC]`
                    }
                    top += `
${i+1}. **${title} [${diff}] ${shortenmod}** (${star}★)
▸ Score: ${score}
**▸ Rank: ${rank} ▸ Combo: ${combo}/${fc} ▸ PP: ${pp}** ${fcguess}
**▸ Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${username}`)
                .setThumbnail(`http://s.ppy.sh/a/${userid}.png`)
                .setColor('#7f7fff')
                .setDescription(top)
                message.channel.send({embed});
            }
            osutop()
        }

        if (msg.substring(0,21) == '!osuserverleaderboard') {
            async function osuserverleaderboard() {
                var player = []
                for (var i = 0; i < cache.length; i++) {
                    var user = await osuApi.getUser({u: `${cache.osuname}`})

                }
            }
            osuserverleaderboard()
        }

        // Word detection

        if (msg.includes('school') == true) {
            message.channel.send(`School time D:`)
        }

        if (msg.includes('tired') == true) {
            message.channel.send('Go to sleep then!')
        }

        if (msg.includes('good night') == true) {
            message.channel.send(`Good night ${message.author.username}~ :heart:`)
        }

        if (msg.includes('tiny') == true && msg.includes('tiny bot') !== true) {
            message.channel.send('<@292523841811513348>')
        }
        
        if (msg.includes('jamu') == true) {
            message.channel.send('<@103139260340633600>')
        }

        if (msg.includes('senpu') == true) {
            message.channel.send('<@175179081397043200>')
        }

        if (msg.includes('<@433463871966281731>') == true) {
            var roll = Math.floor(Math.random()*6)
            var respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,`Why you keep pinged me?`,`Stop pinged me! <:chinoangry:450686707881213972>`,`What do you need senpai? <:chinohappy:450684046129758208>`,`<:chinopinged:450680698613792783>`]
            message.channel.send(respone[roll])
        }

        // My Stuff

        if (message.author.id == '292523841811513348' || message.author.id == '175179081397043200') {
            if (msg.includes('luv') == true || msg.includes('love') == true) {
                message.channel.send('You always love everyone! <:megumiPillow:442532695910645760>')
            }
            if (msg.substring(0,6) == "!check") {
                if (msg.substring(0,6) == "!check") {  
                    message.channel.send(JSON.stringify(cache));
                }
            }
            if (msg.includes('suck at coding') == true) {
                message.channel.send('No you not! <:chinohappy:450684046129758208>')
            }
        }
    }

});

bot.login('NDMzNDYzODcxOTY2MjgxNzMx.Da8OUg.75Wxf_noVjgpa-m7zx7rj61xnh0');