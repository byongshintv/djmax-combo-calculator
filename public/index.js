
let $ = document.querySelector.bind(document);
let $$ = document.querySelectorAll.bind(document);

let meta = {
    keys:[4,5,6,8],
    diff:["NM","HD","MX","SC"],
}


let bfs = (() => {

    let main = (charts,target) => {
        let memo = {}
        let prev = {0:true};
        let next = {};
        while(true){
            for(const preNote of Object.keys(prev)){        
                for(const chart of charts){
                    let {length, note} = chart
                    let nextNote = preNote*1 + note;
                    if(nextNote > target) continue;
                    let preLength = memo[preNote]?.length || 0;
                    let nextLength = preLength + length
                    if( memo[nextNote]?.length === undefined || nextLength < memo[nextNote].length){
                        next[nextNote] = true;
                        
                        memo[nextNote] = { length: nextLength, charts: [...(memo[preNote]?.charts || []),chart ]}
                    }


                }   
            }
            if(Object.keys(next).length === 0) break;
            prev = next;
            next = {};
        }
        return memo[target];

    }

    return main;
})();

let datas;

function calc(datas, filters, targetCombo){
        
    datas = _(datas)
        .filter(({ category }) => filters.category.includes(category) )
        .map(({category, title, length ,notes}) => {
            return _(notes)
            .map((v,i) => ({category, title, length:length*1, note:v*1, key: meta.keys[Math.floor(i / 4)], diff:meta.diff[i % 4], density:v/length }))
            .filter((v,i) => 
                filters.difficulty.includes(i) && 
                filters.category.includes(v.category) &&
                filters.density[0] <= v.density &&
                v.density <= filters.density[1] &&
                filters.category.includes(v.category) && 
                v.note)
            .sort((a,b) => b.density - a.density)
            .uniqBy((a) => a.note)
            .value()
        })
        .flatMap()
        .value()

    return bfs(datas,targetCombo)
}

let confirm = false
document.getElementById("start").addEventListener("click",function(e){
    e.preventDefault();
    let filters = {
        category:[...$$("#series input")].filter(v => v.checked).map( v=> v.value),
        difficulty:[...$$("#diffs input")].filter(v => v.checked).map( v=> v.value*1),
        density:densitySlider.get().map(v => v*1),
    }

    let startCombo = Math.abs($("#comboStart").value*1||0)
    let endCombo = ($("#comboEnd").value*1||0)
    let comboWeight = Math.floor(Math.abs(startCombo - endCombo));
    if( endCombo < startCombo){
        return M.toast({html: '?????? ????????? ?????????????????? ?????? ??? ????????????.'})
    }
    if( comboWeight > 30000 && confirm === false){
        confirm = true;
        return M.toast({html: `??????????????? ???????????? ${comboWeight.toLocaleString()}?????????. ??????????????? ???????????? ?????? ??? ?????? ????????? ???????????????. `})
    }
    let result = calc(datas, filters, comboWeight)    
    if(result === undefined){
        return M.toast({html: '????????? ?????? ????????????.'})
    }


    let {length,charts} = result
    let resultHtml = `<h5>??? ????????? : ${Math.floor(length/60)}??? ${length % 60}??? <h5>`
    charts.forEach(({diff,key,title,category,length,note}) => {
        resultHtml += `
        <div class="song">
            <div class="category">[${key}B${diff}]${category}</div>
            <div class="title">${title}(${note}Note)</div> 
            <div class="calc">
                <div class="right">${length}???</div>
                <div>(+= ${note+startCombo}combo)</div>
            </div>
        </div>`

        startCombo += note
    })
    $("#result .value").innerHTML = resultHtml;
    return false;
})

let densitySlider = noUiSlider.create($('#density'), {
 start: [0, 15],
 connect: true,
 step: 0.1,
 orientation: 'horizontal', // 'horizontal' or 'vertical'
 range: {
   'min': 0,
   'max': 15
 },
});


(async function(){
    datas = await (await fetch("./datas.json")).json();
    let defaultDiff = [0,1,2,4,5,8,9]
    let diffhtmls = meta.keys
    .map(key => meta.diff.map(diff => `${key}B${diff}`))
    .flat()
    .map((diff,index) => {
        return `<div class="col s3"><label><input name="category" type="checkbox" value="${index}" ${defaultDiff.includes(index) ? "checked" : ""} /><span>${diff}</span></label></div>`
    })
    .join("")
    document.getElementById("diffs").innerHTML = diffhtmls

    let serieshtmls = _(datas)
    .map(v => v.category).uniq()
    .map((series) => {
        return `<div class="col s3"><label><input name="difficulty" type="checkbox" value="${series}" checked /><span>${series}</span></label></div>`
    })
    .join("")
    document.getElementById("series").innerHTML = serieshtmls
})();