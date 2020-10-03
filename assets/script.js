export default class PickleTable {
    constructor(config){
        this.config = {
            referance:null,
            container:'', // target contianer for build
            headers:[], //table headers (object)
            type:'local', //data type local or ajax 
            ajax:{
                url:'',
                data:{
                    filter:{},
                    order:{},
                }
            },
            pageCount:1, //table page count (will calculating later)
            pageLimit:10, //table page limit
            data:[],
            currentPage:1, //table current page
            currentData:{}, //table current data
            //events
            afterRender:null,
            rowClick:null,
            rowCreated:null,
            columnCreated:null,
            columnClick:null
        };  

        //set custom table config
        for(let key in config){
            if(this.config[key] !== undefined) this.config[key] = config[key];
        }

        //build table
        this.build();

        //start events
        this.events();

        //set data
        this.getData();
    }

    /**
     * this method will set component events
     */
    events(){
        //listen page changing
        this.config.pagination.addEventListener('click',e=>{
            if(e.target.classList.contains('btn_page')){
                //set page
                this.config.currentPage = e.target.dataset.page;
                //set data
                this.getData();
            }
        });
    }

    /**
     * this method will build table
     */
    build(){
        //at this area wee will building table element
        //get referance
        this.config.referance = document.querySelector(this.config.container);
        //set class targeter
        this.config.referance.classList.add('pickletable');

        //build headers and table skeleton
        const table = document.createElement('table');
        table.style.width = '100%';
        
        const headers = document.createElement('thead');
        const divTable = document.createElement('div');
        divTable.classList.add('divTable');
       
        this.config.pagination = document.createElement('div');
        this.config.pagination.classList.add('divPagination');

        this.config.body = document.createElement('tbody');
        
        //now build headers
        const row = document.createElement('tr');
        for(let i=0;i<this.config.headers.length;i++){
            //create item
            const item = document.createElement('th');
            item.innerHTML = this.config.headers[i].title;
            console.log(item);
            //add to container
            row.appendChild(item);
        }
        //add headers to table header
        headers.appendChild(row);
        
        //add elements to table
        table.appendChild(headers);
        table.appendChild(this.config.body);
        divTable.appendChild(table);
        //append table to document
        
        this.config.referance.appendChild(divTable);
        //append pagination to document
        this.config.referance.appendChild(this.config.pagination);
    }


    /**
     * this method will get data from ajax target or container
     */
    async getData(/*order = null,filter = null*/){
        this.config.body.innerHTML = '';
        if(this.config.type === 'local'){
            //get page values
            let data = this.config.data;
            //if all data is not wanted
            if(String(this.config.pageLimit) !== -1){
                data = this.config.data.slice((this.config.currentPage-1)*this.config.pageLimit , this.config.currentPage*this.config.pageLimit);
                this.config.pageCount = Math.ceil(this.config.data.length / this.config.pageLimit);
            }

            for(let i=0;i<data.length;i++){
                if(data[i].id === undefined) data[i].id = (new Date).getTime();
                this.config.currentData[data[i].id] = data[i];
                //set row to table
                this.addRow(data[i]);
            }
        }else{
            //get data via ajax
            if(this.config.ajax.data.scale === undefined){
                this.config.ajax.data.scale = {
                    limit:10,
                    page:1
                };
            }
            //set limit filters
            this.config.ajax.data.scale.page  = this.config.currentPage;
            this.config.ajax.data.scale.limit = this.config.pageLimit;
            await this.request({
                method:'POST',
                url:this.config.ajax.url,
                data:{
                    tableReq:JSON.stringify(this.config.ajax.data)
                }
            }).then(rsp=>{
                //set page count and current data
                if(rsp.pageCount !== undefined) this.config.pageCount = rsp.pageCount;
                //set data
                if(rsp.data !== undefined && rsp.data.length > 0){
                    for(let i=0;i<parseInt(rsp.filteredCount);i++){
                        //set id if not exist
                        if(rsp.data[i].id===undefined) rsp.data[i].id = (new Date()).getTime()+'_'+i;
                        //add to table
                        this.addRow(rsp.data[i]);
                    }
                }
            });
        }

        //create pagination
        let start = 1;
        let limit = 5;
        let end = 6;
        if(this.config.currentPage  > 3){
            //possible values
            const possStart = this.config.currentPage - 2;
            const possEnd = possStart+limit;
            //end is higher then page count
            if(possEnd >= this.config.pageCount){
                start = this.config.pageCount - limit;
                end = this.config.pageCount;
            }else{
                //normal limits
                start = possStart;
                //set limit
                end = possEnd;
            }
        }
        this.config.pagination.innerHTML = '';
       
        //start building buttons
        for(let i=start;i<=end;i++){
            //create buttons
            const btn = document.createElement('button');
            btn.innerHTML = i;
            btn.type = 'button';
            btn.dataset.page = i;
            btn.classList.add('btn_page');
            //add current tag if current page
            if(i === this.currentPage){
                btn.classList.add('current');
            }
            //add button to pagnation div
            this.config.pagination.appendChild(btn);
            if(i === this.config.pageCount) break;
        }

        //trigger after render if not null
        if(this.config.afterRender !== null) this.config.afterRender({
            currentData:this.config.currentData, //current rendered data
            currentPage:this.config.currentPage, //current rendered page
        });
    }

    
    //#region helpers
    /**
     * system request method
     * @param {json object} rqs 
     */
    async request(rqs) {
        let fD = new FormData();

        for (let key in rqs['data']) {
            fD.append(key, rqs['data'][key]);
        }

        const op = {
            method: rqs['method'],
        };

        if (rqs['method'] !== 'GET') {
            op.body = fD;
        }
        return await fetch(rqs['url'], op).then((response) => {
            //convert to json
            return response.json();
        });
    }




    /**
     * this method clear all data on table 
     */
    clearData(){
        //reset table data 
        this.config.currentData = {};
        this.config.data = [];
        this.config.pageCount=1; //table page count (will calculating later)
        this.config.pageLimit=10; //table page limit
        this.config.data=[];
        this.config.currentPage=1; //table current page
        this.config.currentData={}; //table current data

        //clean body
        this.config.body.innerHTML = '';
        //clean pagination
        this.config.pagination.innerHTML = '';
    }


    /**
     * this method will set data from data container or ajax target
     * @param {object} data 
     */
    addRow(data){
        const row = document.createElement('tr');
        for(let i = 0;i<this.config.headers.length;i++){
            const column = document.createElement('td');
            column.innerHTML = data[this.config.headers[i].key];
            row.appendChild(column);
        }
        this.config.body.appendChild(row);

        //set data to container
        this.config.currentData[data.id] = data;

        //id added from outside calculate new page count value
        //to do
        
    }

    //#endregion
}