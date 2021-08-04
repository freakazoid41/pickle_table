export default class PickleTable {
    constructor(config){
        this.config = {
            filterLock : false,
            referance:null,
            container:'', // target contianer for build
            headers:[], //table headers (object)
            type:'local', //data type local or ajax 
            paginationType : 'number', //pagination type ('scroll','number')
            ajax:{
                url:'',
                data:{
                    filter:{},
                    order:{},
                }
            },
            initialFilter:{},
            pageCount:1, //table page count (will calculating later)
            pageLimit:10, //table page limit
            data:[],//outside data container(temporary data)
            tableData:{},
            currentPage:1, //table current page
            currentData:{}, //table current page data
            //events
            afterRender  : null,
            pageChanged  : null,
            rowClick     : null,
            rowFormatter : null,
            columnSearch : false,
        };  

        //set custom table config
        for(let key in config){
            if(this.config[key] !== undefined) this.config[key] = config[key];
        }
        //set startup filter if setted
        if(this.config.initialFilter.length > 0) this.currentFilter = this.config.initialFilter;

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
        this.config.pagination.addEventListener('click',async e=>{
            if(e.target.classList.contains('btn_page')){
                this.changePage(e.target.dataset.page);
            }
        });
        //listen scroll pagination
        if(this.config.paginationType === 'scroll'){
            this.pageObserver = new IntersectionObserver((entries) => {
                //console.log(e,elm)
                if(entries[0]['intersectionRatio'] > 0.5 && entries[0].target.dataset.next === 'waiting') {
                    entries[0].target.dataset.next = 'loaded';
                    this.changePage(this.config.currentPage+1);
                }
                //console.log('new page coming')
                // callback code
            }, { threshold: [0.5] });
        }
        
        //listen column search
        if(this.config.columnSearch){
            this.config.referance.addEventListener('change',e=>{
                if(e.target.classList.contains('search-input')){
                    const elms = this.config.referance.querySelectorAll('.search-input');
                    const filter = [];
                    for(let i=0;i<elms.length;i++){
                        if(elms[i].value.trim() != ''){
                            filter.push({
                                key   : elms[i].name, // column key
                                type  : 'like', // filtering type ('like','<','>')
                                value : elms[i].value.trim() //wanted column value
                            });
                        }
                        
                    }
                    this.setFilter(filter);
                }
                
            });
        }
    }

    /**
     * this method will build table
     */
    build(){
        //at this area wee will building table element
        //get referance
        this.config.referance = document.querySelector(this.config.container);
        //set class targetter
        this.config.referance.classList.add('pickletable');

        //build loader
        this.config.loader = document.createElement('div');
        this.config.loader.classList.add('ploader');
        this.config.referance.appendChild(this.config.loader);

        //build headers and table skeleton
        const table = document.createElement('table');
        table.classList.add('fade-in');
        table.style.width = '100%';
        //temporary
        table.style.display = 'none';

        const headers = document.createElement('thead');
        const divTable = document.createElement('div');
        divTable.classList.add('divTable');
       
        this.config.pagination = document.createElement('div');
        this.config.pagination.classList.add('divPagination');

        this.config.body = document.createElement('tbody');
        
        //now build headers
        const row  = document.createElement('tr');
        const srow = document.createElement('tr');
        for(let i=0;i<this.config.headers.length;i++){
            //create item
            const item = document.createElement('th');
            item.innerHTML = '<span>'+this.config.headers[i].title+'</span>';
            item.dataset.key = this.config.headers[i].key;
            //set header text align
            if(this.config.headers[i].headAlign !== undefined) item.style.textAlign = this.config.headers[i].headAlign;
            //set header width if entered
            if(this.config.headers[i].width !== undefined) item.style.width = this.config.headers[i].width;

            //add order icon if order is true for column
            if(this.config.headers[i].order===true){
                item.classList.add('orderable');
                item.onclick=(e)=>{
                    if(!e.target.classList.contains('search-input')){
                        //set default sort param
                        if(this.config.headers[i].orderCurrent === undefined) this.config.headers[i].orderCurrent = 'desc';
                        //create order element
                        const obj = {
                            type:this.config.headers[i].type,
                            style:this.config.headers[i].orderCurrent,
                            key:this.config.headers[i].key
                        }
                        
                        this.config.isOrdering = true;

                        //send order element to data method
                        this.getData(obj);
                        //change order param for next event
                        this.config.headers[i].orderCurrent = this.config.headers[i].orderCurrent == 'asc' ? 'desc' : 'asc';
                    }
                };
            }else{
                if(this.config.headers[i].headClick !== undefined){
                    item.onclick=()=>this.config.headers[i].headClick();
                }
            }
            
          


            //create search input
            if(this.config.columnSearch && this.config.headers[i].key!=='#'){
                //const sitem = document.createElement('th');
                const input = document.createElement('input');
                
                input.classList.add('search-input');
                input.style.width = '100%';
                input.name = this.config.headers[i].key;
                //console.log(this.config.headers[i].key)
                item.appendChild(document.createElement('br'));
                item.appendChild(input);
                //srow.appendChild(sitem);
            }
            //add to container
            row.appendChild(item);

        }
        //add headers to table header
        headers.appendChild(row);
        if(this.config.columnSearch){
            //search row
            headers.appendChild(srow);
        }

        //add elements to table
        table.appendChild(headers);
        table.appendChild(this.config.body);
        divTable.appendChild(table);
        
        //give referance to table for loading
        this.config.tableReferace = table;
        //append table to document
        this.config.referance.appendChild(divTable);
        //append pagination to document
        this.config.referance.appendChild(this.config.pagination);

        //reshape data if local
        if(this.config.type === 'local'){
            //index data
            for(let i=0;i<this.config.data.length;i++){
                if(this.config.data[i].id === undefined)this.config.data[i].id = (new Date()).getTime()+'_'+i;
                this.config.tableData['row_'+this.config.data[i].id] = this.config.data[i];
            }
            //remove data load
            this.config.data = [];
        }
    }

    /**
     * this method will get data from ajax target or container
     */
    async getData(order = this.currentOrder,filter = this.currentFilter){
        this.config.filterLock = true;
        //start loader
        this.config.loader.style.display = '';
        const body = this.config.tableReferace.querySelector('tbody');
        if(this.config.paginationType !== 'scroll' ||  this.config.isFiltering || this.config.isOrdering){
            body.style.display = 'none';
            this.config.body.innerHTML = '';
            this.config.isFiltering = false;
            this.config.isOrdering = false;
        } 

        if(this.config.type === 'local'){
            //get page values
            let data = [];
            let list = Object.values(this.config.tableData);
            //if order is not null
            if(order !== undefined){
                //this.currentOrder = order;
                const sortColumn = (a,b) =>{
                    //there is a 3 type ordering (string - date - number)
                    
                    let itemA; // ignore upper and lowercase
                    let itemB; // ignore upper and lowercase
                    //decide type
                    switch(order.type){
                        default:
                            itemA = a[order.key].toUpperCase(); // ignore upper and lowercase
                            itemB = b[order.key].toUpperCase(); // ignore upper and lowercase
                            break;
                        case 'number':
                            itemA = parseFloat(a[order.key]); // make number
                            itemB = parseFloat(b[order.key]); // make number
                            break
                        case 'date':
                            //make date number then order
                            //replace emptiness with datetime character
                            itemA = Date.parse(a[order.key].replace(/T/g, ""));
                            itemB = Date.parse(b[order.key].replace(/T/g, ""));
                            break;
                    }

                    if(order.style === 'asc'){
                        return itemA < itemB ? -1 : 1;
                    }else{
                        return itemA > itemB ? -1 : 1;
                    }
                };

                list = list.sort((a, b) => sortColumn(a,b));
            }

            //if filter is not null
            if(filter !== undefined){
                //set coming filter to current filter
                this.currentFilter = filter;
                for(let i=0;i<this.currentFilter.length;i++){
                    let fdata = [];
                    //filter list and make equal to old one
                    for(let j=0;j<list.length;j++){
                        if(list[j][this.currentFilter[i].key]!== undefined){
                            
                            switch(this.currentFilter[i].type){
                                case 'like':
                                    if(String(list[j][this.currentFilter[i].key]).includes(this.currentFilter[i].value))fdata.push(list[j]);
                                    break;
                                case '=':
                                    if(list[j][this.currentFilter[i].key] == this.currentFilter[i].value) fdata.push(list[j]);
                                    break;
                                case '<':
                                    if(list[j][this.currentFilter[i].key] < this.currentFilter[i].value) fdata.push(list[j]);
                                    break;
                                case '>':
                                    if(list[j][this.currentFilter[i].key] > this.currentFilter[i].value) fdata.push(list[j]);
                                    break;
    
                            }
                        }
                    }
                    //set to list
                    list = fdata;
                }
            }


            //if all data is not wanted
            if(parseInt(this.config.pageLimit) !== -1){
                data = list.slice((this.config.currentPage-1)*this.config.pageLimit , this.config.currentPage*this.config.pageLimit);
                if(data.length!==0)this.config.pageCount = Math.ceil(list.length / this.config.pageLimit);
            }else{
                data = list;
            }

            for(let i=0;i<data.length;i++){
                if(data[i].id === undefined) data[i].id = (new Date).getTime();
                //set row to table
                this.addRow(data[i],false,false,i);
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
            //set ordering
            if(order !== undefined){
                this.currentOrder = order;
                this.config.ajax.data.order = order;
            }


            //if filter is not null
            if(filter !== undefined){
                //set coming filter to current filter
                this.currentFilter = filter;
                this.config.ajax.data.filter = filter;
            }
            //send data request
            await this.request({
                method:'POST',
                url:this.config.ajax.url,
                data:{
                    tableReq:JSON.stringify(this.config.ajax.data)
                }
            }).then(rsp=>{
                //clean current data
                this.config.currentData = {};
                //set page count and current data
                if(rsp.pageCount !== undefined) this.config.pageCount = rsp.pageCount;
                //set data
                if(rsp.data !== undefined && rsp.data.length > 0){
                    for(let i=0;i<parseInt(rsp.filteredCount);i++){
                        //set id if not exist
                        if(rsp.data[i].id===undefined) rsp.data[i].id = (new Date()).getTime()+'_'+i;
                        //add to table
                        this.addRow(rsp.data[i],false,false,i);
                    }
                }
            });
        }
        //create pagination
        this.calcPagination();

        //trigger after render if not null
        if(this.config.afterRender !== null) this.config.afterRender(
            this.config.currentData, //current rendered data
            this.config.currentPage //current rendered page
        );
        //close loader
        this.config.loader.style.display = 'none';
        body.style.display = '';
        this.config.tableReferace.style.display = '';
        this.config.filterLock = false;
    }

    
    //#region helpers
    /**
     * system request method
     * @param {json object} rqs 
     */
    async request(rqs) {
        let fD = new FormData();

        for (let key in rqs.data) {
            fD.append(key, rqs.data[key]);
        }

        const op = {
            method: rqs.method,
            mode  : 'cors',
            credentials: 'include' 
        };

        if(this.config.ajax !== undefined && this.config.ajax.headers !== undefined) op.headers = this.config.ajax.headers

        if (rqs.method !== 'GET') {
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
        this.config.pageCount=1; //table page count (will calculating later)
        //this.config.pageLimit=10; //table page limit
        this.config.tableData={};
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
    addRow(data,outside=true,prepend = false,count = 0){
        data.columnElms = {};
        const row = document.createElement('tr');
        //trigger row formatter if exist
        if(this.config.rowFormatter !== null){
            const modifiedData = this.config.rowFormatter(row,data);
            //if new data returned set to row data
            if(modifiedData !== undefined) data = modifiedData;
        }

        //set row click if setted
        if(this.config.rowClick !== null){
            row.onclick = () => this.config.rowClick(row,data);
        }

        for(let i = 0;i<this.config.headers.length;i++){
            const column = document.createElement('td');
            //set header text align
            if(this.config.headers[i].colAlign !== undefined) column.style.textAlign = this.config.headers[i].colAlign;
            //trigger column formatter if exist
            if(this.config.headers[i].columnFormatter !== undefined){
                column.innerHTML = this.config.headers[i].columnFormatter(column,data,data[this.config.headers[i].key]);
            }else{
                column.innerHTML = data[this.config.headers[i].key];
            }

            const isVisible = !(document.querySelector('th[data-key="'+this.config.headers[i].key+'"]').style.display === 'none');
            //check if header is visible
            if(!isVisible) column.style.display = 'none';
            
            row.appendChild(column);
            //set columnt click if exist
            if(this.config.headers[i].columnClick !== undefined){
                column.onclick = () => this.config.headers[i].columnClick(column,data,data[this.config.headers[i].key]);
            }

            data.columnElms[this.config.headers[i].key] = column;
        }
        if(parseInt(this.config.pageLimit) !== -1 && this.config.paginationType === 'scroll' && count === parseInt(this.config.pageLimit-(this.config.pageLimit/3))){
            //add class for data appending..
            row.classList.add('page-flag');
            row.dataset.next = 'waiting';
            this.pageObserver.observe(row);
        }
        

        //set elements to data
        data.rowElm = row;

        //set data to container
        this.config.currentData['row_'+data.id] = data;

        //id added from outside calculate new page count value
        if(outside){
            //add to table data
            const tempObj = {}
            tempObj['row_'+data.id] = data;
            this.config.tableData = {
                ...tempObj,
                ...this.config.tableData
            };
            
            //recalculate page count 
            this.config.pageCount = Math.ceil(Object.values(this.config.tableData).length / this.config.pageLimit);
            
            //recalculate pagination if local data
            if(this.config.type === 'local') this.calcPagination();
            //remove last child from current page if the page limit has been exceeded
            if(parseInt(this.config.pageLimit) > 0 && this.config.pageLimit <= Object.values(this.config.currentData).length){
                this.config.referance.querySelector('table tbody tr:last-child').remove();
            }
        }

        if(prepend) {
            //add out row to top
            this.config.body.prepend(row);
        }else{
            //append row to body
            this.config.body.append(row);
        }
    }

    /**
     * this method will update table row with formatter callback
     * @param {int} rowId 
     * @param {object} data 
     */
    updateRow(rowId,data = null){
        const row = this.config.currentData['row_'+rowId];
        if(row !== undefined){
            //foreach header
            for(let i = 0;i<this.config.headers.length;i++){
                //column key
                const key = this.config.headers[i].key;
                if(data[key] !== undefined){
                    //get column element
                    const column = row.columnElms[key];
                    //update element
                    if(this.config.headers[i].columnFormatter !== undefined){
                        column.innerHTML = this.config.headers[i].columnFormatter(column,row,data[key]);
                    }else{
                        column.innerHTML = data[key];
                    }
                    this.config.currentData['row_'+rowId][key] = data[key];
                }
            }
            //set foreach data
            for(let key in data){
                this.config.currentData['row_'+rowId][key] = data[key];
            }


            if(this.config.rowFormatter !== null) this.config.rowFormatter(row.rowElm,row);
            return true;
        }else{
            return false;
        }
    }

    /**
     * this method will delete table row 
     * @param {int} rowId 
     */
    deleteRow(rowId){
        if(this.config.currentData['row_'+rowId] !== undefined){
            //remove element
            this.config.currentData['row_'+rowId].rowElm.remove();
            //delete item from stack
            delete this.config.currentData['row_'+rowId];
            //recalculate page count if local data
            if(this.config.type === 'local'){
                const list = Object.values(this.config.tableData);
                //if all data is not wanted
                this.config.pageCount = list.length!==0 ? Math.ceil(list.length / this.config.pageLimit) : 1;
                //recalculate pagination
                this.calcPagination();
                //get an item from another page to this page 
                const data = list.slice(this.config.currentPage*this.config.pageLimit , (this.config.currentPage+1)*this.config.pageLimit);

                //add next page item to this page
                if(data.length > 0)this.addRow(data[0],false);
            }
            return true;
        }else{
            return false;
        }
    }

    /**
     * this method will return row data if exist in current page
     * @param {integer} rowId 
     */
    getRow(rowId){
        return this.config.currentData['row_'+rowId];
    }


    /**
     * this method will set filter after data is loaded
     * @param {object} data 
     */
    async setFilter(data = []){
        //check if filter lock is on
        while(this.config.filterLock === true){
            await (new Promise(resolve => setTimeout(resolve, 200)));
        }
        //lock filter
        this.config.filterLock = true;
        this.config.isFiltering = true;
        //set filter
        this.currentFilter = data;
        //set to first page
        this.config.currentPage = 1;
        //get data again
        await this.getData();
        //unlock filter
        //this.config.filterLock = false;
    }


    /**
     * this method will calculate pagination
     */
    calcPagination(){
        if(this.config.pageCount > 0 && this.config.paginationType !== 'scroll'){
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
                    start = possStart > 0 ? possStart : 1;
                    //set limit
                    end = possEnd;
                }
                // minus value check
                start = start > 0 ? start : 1;
            }
            this.config.pagination.innerHTML = '';
        
            //start building buttons
            const buildBtn = (count,title) => {
                //create buttons
                const btn = document.createElement('button');
                btn.innerHTML = title;
                btn.type = 'button';
                btn.dataset.page = count;
                btn.classList.add('btn_page');
                //add current tag if current page
                if(count === parseInt(this.config.currentPage)){
                    btn.classList.add('current');
                }
                //add button to pagnation div
                this.config.pagination.appendChild(btn);
            }
            //put first button
            buildBtn(1,'İlk');
            for(let i=start;i<=end;i++){
                //create buttons
                buildBtn(i,i);
                if(i === this.config.pageCount) break;
            }
            //put last button
            buildBtn(this.config.pageCount,'Son');
        }else{
            this.config.pagination.innerHTML = '';
        }
    }

    /**
     * this method will change page
     * @param {integer} page 
     */
    async changePage(page){
        //set page
        this.config.currentPage = page;
        //set data
        await this.getData();

        //run callback
        //trigger after render if not null
        if(this.config.pageChanged !== null) this.config.pageChanged(
            this.config.currentData, //current rendered data
            this.config.currentPage, //current rendered page
        );
    }
    //#endregion
}
