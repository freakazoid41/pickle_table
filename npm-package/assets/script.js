export default class PickleTable {
    constructor(config){
        this.config = {
            filterLock : false,
            height:'100%',
            referance:null,
            showTotals : false,
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
            initialFilter:[],
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
            rowAdded     : null,
            ajaxDataCallback : null,
            ajaxReturnCallback : null,
            columnSearch : false,
            nextPageIcon : null,
            prevPageIcon : null,
            // grouping config
            groupBy : null,
            groupCollapsed : {},
            groupFormatter : null,
            groupToggleCallback : null
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
            const checkVisible = (elm) => {
                const rect = elm.getBoundingClientRect();
                const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
            };
            this.pageObserver = new IntersectionObserver((entries) => {
                //console.log(e,elm)
                if((entries[0].intersectionRatio > 0 || checkVisible(entries[0].target)) && entries[0].target.dataset.next === 'waiting') {
                    entries[0].target.dataset.next = 'loaded';
                    this.changePage(this.config.currentPage+1);
                }
                //console.log('new page coming')
                // callback code
            }, { threshold: [0.5] });
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
        table.classList.add('table','dataTable');
        table.style.width = '100%';
        //temporary
        table.style.display = 'none';

        const headers = document.createElement('thead');
        const divTable = document.createElement('div');
        divTable.classList.add('divTable');
        
        //set main container height
        this.config.referance.setAttribute('style','height:'+this.config.height+' !important;');
        
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
                        if(this.config.paginationType === 'scroll'){
                            this.config.currentPage = 1;
                        }
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
                let input = document.createElement('input');
               
              

                if(this.config.headers[i]?.searchType == 'select'){
                    input = document.createElement('select');

                    if(this.config.headers[i]?.searchValues?.length > 0){
                        this.config.headers[i]?.searchValues.forEach(el => {
                            const op = document.createElement('option');
                            op.text = el.text;
                            op.value = el.value;

                            input.appendChild(op);
                        });
                    }
                }

                if(this.config.headers[i]?.searchClass?.length > 0) input.classList.add(...this.config.headers[i]?.searchClass);
                input.classList.add('search-input');
                input.style.width = '100%';
                input.name = this.config.headers[i].key;

                input.oninput = (e) => {
                    
                    if(this.config.headers[i].searchCallback === undefined){
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
                    }else{
                        this.config.headers[i].searchCallback(e.target.value,e.target);
                    }
                };


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

        if(this.config?.showTotals === true){
            this.addTotalsRow();
        }
        
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
                this.currentOrder = order;
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
                    const value = this.currentFilter[i].value;
                    //filter list and make equal to old one
                    for(let j=0;j<list.length;j++){
                        if(list[j][this.currentFilter[i].key]!== undefined){
                            switch(this.currentFilter[i].type){
                                case 'like':
                                    if(String(list[j][this.currentFilter[i].key]).toUpperCase().includes(value.toUpperCase()))fdata.push(list[j]);
                                    break;
                                case '=':
                                    if(list[j][this.currentFilter[i].key] == value) fdata.push(list[j]);
                                    break;
                                case '<':
                                    if(list[j][this.currentFilter[i].key] < value) fdata.push(list[j]);
                                    break;
                                case '>':
                                    if(list[j][this.currentFilter[i].key] > value) fdata.push(list[j]);
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

            // check if grouping is enabled
            if(this.config.groupBy !== null) {
                this.renderGroups(data);
            } else {
                for(let i=0;i<data.length;i++){
                    if(data[i].id === undefined) data[i].id = (new Date).getTime();
                    //set row to table
                    this.addRow(data[i],false,false,i);
                }
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

            
            if(this.config.ajaxDataCallback !== null) this.config.ajax.data = {...this.config.ajax.data,...this.config.ajaxDataCallback()};

            //send data request
            await this.request({
                method:'POST',
                url:this.config.ajax.url,
                data:{
                    tableReq:JSON.stringify(this.config.ajax.data)
                }
            }).then(rsp=>{
                //clean current data
                if(this.config.paginationType !== 'scroll') this.config.currentData = {};
                //set page count and current data
                if(rsp.pageCount !== undefined) this.config.pageCount = rsp.pageCount;
                //set data
                if(rsp.data !== undefined && rsp.data.length > 0){
                    // assign IDs if missing
                    for(let i=0;i<parseInt(rsp.filteredCount);i++){
                        if(rsp.data[i].id===undefined) rsp.data[i].id = (new Date()).getTime()+'_'+i;
                    }
                    
                    // check if grouping is enabled
                    if(this.config.groupBy !== null) {
                        this.renderGroups(rsp.data);
                    } else {
                        for(let i=0;i<parseInt(rsp.filteredCount);i++){
                            //add to table
                            this.addRow(rsp.data[i],false,false,i);
                        }
                    }
                }

                if(this.config.ajaxReturnCallback !== null) this.config.ajaxReturnCallback(rsp);
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
            headers: {
                ...(document.querySelector('meta[name="csrf-token"]') !== null ? {'X-CSRF-TOKEN' : document.querySelector('meta[name="csrf-token"]').content,} : {})
            },
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
     * @param {boolean} outside 
     * @param {boolean} prepend 
     * @param {number} count 
     * @param {string} groupValue - group identifier for grouped rows
     * @param {boolean} isCollapsed - whether group is collapsed
     */
    addRow(data,outside=true,prepend = false,count = 0, groupValue = null, isCollapsed = false){
        data.columnElms = {};
        const row = document.createElement('tr');
        const columnAddedCallbacks = [];
        
        // add group data attributes if grouping is enabled
        if(groupValue !== null) {
            row.dataset.group = groupValue;
            row.dataset.collapsed = isCollapsed;
            if(isCollapsed) {
                row.style.display = 'none';
            }
        }
        
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
                const newData = this.config.headers[i].columnFormatter(column,data,data[this.config.headers[i].key]);
                if(typeof newData === 'object'){
                    column.appendChild(newData);
                }else{
                    column.innerHTML = newData;
                }
            }else{
                column.innerHTML = data[this.config.headers[i].key];
            }

            

            const isVisible = !(document.querySelector('th[data-key="'+this.config.headers[i].key+'"]').style.display === 'none');
            //check if header is visible
            if(!isVisible) column.style.display = 'none';
            
            row.appendChild(column);

            //trigger column created event
            if(this.config.headers[i].columnCreated !== undefined){
                columnAddedCallbacks.push({
                    event  : this.config.headers[i].columnCreated ,
                    column : column,
                    row    : row,
                    data : data,
                    columnData : data[this.config.headers[i].key]
                });
                //this.config.headers[i].columnCreated(column,row,data,data[this.config.headers[i].key]);
            }

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
            if(parseInt(this.config.pageLimit) > 0 && this.config.pageLimit < Object.values(this.config.currentData).length){
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
        // execute row added callfack if exist
        if(this.config.rowAdded != null) this.config.rowAdded(row,data);

        //execute column added callbacks if exist
        for(let i = 0; i < columnAddedCallbacks.length; i++) {
            const event = columnAddedCallbacks[i]
            event.event(event.column,event.row,event.data,event.columnData);
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
            //set data first 
            for(let key in data) this.config.currentData['row_'+rowId][key] = data[key];
            //foreach header
            for(let i = 0;i<this.config.headers.length;i++){
                //column key
                const key = this.config.headers[i].key;
                if(data[key] !== undefined){
                    //get column element
                    const column = row.columnElms[key];
                    //update element
                    if(this.config.headers[i].columnFormatter !== undefined){
                        const newData = this.config.headers[i].columnFormatter(column,row,data[this.config.headers[i].key]);
                        if(typeof newData === 'object'){
                            column.innerHTML = '';
                            column.appendChild(newData);
                        }else{
                            column.innerHTML = newData;
                        }
                    }else{
                        column.innerHTML = data[key];
                    }
                    
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

    addTotalsRow(){
        const old = this.config.tableReferace.querySelector('tfoot');
        if(old != null) old.remove();
       
        const tfoot = document.createElement('tfoot');
        tfoot.classList.add('totals');

        const row = document.createElement('tr');
        for(let i = 0;i<this.config.headers.length;i++){
            
            const column = document.createElement('td');
            column.innerHTML = this.config.headers[i]?.bottomData ?? '';

            row.appendChild(column);

            if(this.config.headers[i]?.bottomDataFormatter) this.config.headers[i]?.bottomDataFormatter(column)
        }

        tfoot.appendChild(row);
        this.config.tableReferace.append(tfoot);
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
        //add initial filter to search
        if(this.config.initialFilter.length > 0){
            for(let i=0;i<this.config.initialFilter.length;i++){
                data.push(this.config.initialFilter[i]);
            }
        }


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

                if(!isNaN(title)) btn.classList.add('btn_page','btn_number');

                //add current tag if current page
                if(count === parseInt(this.config.currentPage)){
                    btn.classList.add('current');
                }
                //add button to pagnation div
                this.config.pagination.appendChild(btn);
            }
            //put first button


            buildBtn(1,(this.config.prevPageIcon !== null ? this.config.prevPageIcon : '<i class="fa-solid fa-chevron-left"></i>'));
            for(let i=start;i<=end;i++){
                //create buttons
                buildBtn(i,i);
                if(i === this.config.pageCount) break;
            }
            //put last button
            buildBtn(this.config.pageCount,(this.config.nextPageIcon !== null ? this.config.nextPageIcon : '<i class="fa-solid fa-chevron-right"></i>'));
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
    
    /**
     * Organize data into groups based on groupBy column
     * @param {Array} data 
     * @returns {Object} grouped data
     */
    organizeDataByGroup(data) {
        const grouped = {};
        
        for(let i = 0; i < data.length; i++) {
            const row = data[i];
            let groupValue = row[this.config.groupBy];
            
            // handle null/undefined values
            if(groupValue === null || groupValue === undefined) {
                groupValue = '(Boş)';
            } else {
                // convert objects to string representation
                if(typeof groupValue === 'object') {
                    groupValue = JSON.stringify(groupValue);
                } else {
                    groupValue = String(groupValue);
                }
            }
            
            if(!grouped[groupValue]) {
                grouped[groupValue] = [];
            }
            grouped[groupValue].push(row);
        }
        
        return grouped;
    }
    
    /**
     * Render grouped data with collapsible group headers
     * @param {Array} data 
     */
    renderGroups(data) {
        const grouped = this.organizeDataByGroup(data);
        
        let rowIndex = 0;
        
        // iterate through each group
        for(const [groupValue, groupRows] of Object.entries(grouped)) {
            const isCollapsed = this.config.groupCollapsed[groupValue] || false;
            
            // CHECK: Does this group header already exist?
            let existingHeader = null;
            if(this.groupHeaderElements && this.groupHeaderElements[groupValue]) {
                existingHeader = this.groupHeaderElements[groupValue];
            }
            
            if(existingHeader) {
                // GROUP ALREADY EXISTS - Find position to insert new rows
                let insertAfter = existingHeader;
                const allRows = Array.from(this.config.body.querySelectorAll('tr'));
                const headerIndex = allRows.indexOf(existingHeader);
                
                // Count current rows in this group
                let currentRowCount = 0;
                for(let i = headerIndex + 1; i < allRows.length; i++) {
                    const row = allRows[i];
                    // If this is another group header, we've reached the end of our group
                    if(row.dataset.isGroupHeader === 'true') {
                        break;
                    }
                    // This row belongs to our group
                    if(row.dataset.group === groupValue) {
                        insertAfter = row;
                        currentRowCount++;
                    }
                }
                
                // Add new rows after the last row of this group
                for(let i = 0; i < groupRows.length; i++) {
                    const rowData = groupRows[i];
                    if(rowData.id === undefined) rowData.id = (new Date()).getTime();
                    
                    // Build row element using full addRow logic
                    const rowElm = document.createElement('tr');
                    rowElm.dataset.group = groupValue;
                    rowElm.dataset.collapsed = isCollapsed;
                    if(isCollapsed) rowElm.style.display = 'none';
                    
                    // Initialize columnElms tracking
                    rowData.columnElms = {};
                    
                    // Trigger row formatter if exist
                    let formattedData = rowData;
                    if(this.config.rowFormatter !== null){
                        const modifiedData = this.config.rowFormatter(rowElm, rowData);
                        if(modifiedData !== undefined) formattedData = modifiedData;
                    }
                    
                    // Set row click if set
                    if(this.config.rowClick !== null){
                        rowElm.onclick = () => this.config.rowClick(rowElm, formattedData);
                    }
                    
                    // Add cells with all formatters and callbacks
                    const columnAddedCallbacks = [];
                    for(let j = 0; j < this.config.headers.length; j++){
                        const column = document.createElement('td');
                        if(this.config.headers[j].colAlign !== undefined) column.style.textAlign = this.config.headers[j].colAlign;
                        
                        // Trigger column formatter if exist
                        if(this.config.headers[j].columnFormatter !== undefined){
                            const newData = this.config.headers[j].columnFormatter(column, formattedData, formattedData[this.config.headers[j].key]);
                            if(typeof newData === 'object'){
                                column.appendChild(newData);
                            }else{
                                column.innerHTML = newData;
                            }
                        }else{
                            column.innerHTML = formattedData[this.config.headers[j].key];
                        }
                        
                        // Check if header is visible
                        const isVisible = !(document.querySelector('th[data-key="'+this.config.headers[j].key+'"]').style.display === 'none');
                        if(!isVisible) column.style.display = 'none';
                        
                        rowElm.appendChild(column);
                        
                        // Store column reference
                        formattedData.columnElms[this.config.headers[j].key] = column;
                        
                        // Trigger column created event callback
                        if(this.config.headers[j].columnCreated !== undefined){
                            columnAddedCallbacks.push({
                                event  : this.config.headers[j].columnCreated,
                                column : column,
                                row    : rowElm,
                                data : formattedData,
                                columnData : formattedData[this.config.headers[j].key]
                            });
                        }
                        
                        // Set column click if exist
                        if(this.config.headers[j].columnClick !== undefined){
                            column.onclick = () => this.config.headers[j].columnClick(column, formattedData, formattedData[this.config.headers[j].key]);
                        }
                    }
                    
                    // Store row element reference
                    formattedData.rowElm = rowElm;
                    
                    // Add to current data
                    this.config.currentData['row_'+formattedData.id] = formattedData;
                    
                    // Insert row after insertAfter
                    if(insertAfter.nextSibling) {
                        this.config.body.insertBefore(rowElm, insertAfter.nextSibling);
                    } else {
                        this.config.body.appendChild(rowElm);
                    }
                    insertAfter = rowElm;
                    rowIndex++;
                    
                    // Execute rowAdded callback if exist
                    if(this.config.rowAdded != null) this.config.rowAdded(rowElm, formattedData);
                    
                    // Execute column added callbacks if exist
                    for(let k = 0; k < columnAddedCallbacks.length; k++) {
                        const event = columnAddedCallbacks[k];
                        event.event(event.column, event.row, event.data, event.columnData);
                    }
                }
                
                // Update header row count
                const totalRowCount = currentRowCount + groupRows.length;
                const titleCell = existingHeader.querySelector('span.group-title-text');
                if(titleCell) {
                    if(this.config.groupFormatter !== null) {
                        try {
                            const formattedText = this.config.groupFormatter(groupValue, totalRowCount);
                            titleCell.textContent = formattedText;
                        } catch(e) {
                            console.error('Error in groupFormatter:', e);
                            titleCell.textContent = `${groupValue} (${totalRowCount} öğe)`;
                        }
                    } else {
                        titleCell.textContent = `${groupValue} (${totalRowCount} öğe)`;
                    }
                }
            } else {
                // GROUP DOESN'T EXIST - Create new header and rows
                const groupHeaderRow = this.createGroupHeader(groupValue, groupRows.length, isCollapsed);
                this.config.body.appendChild(groupHeaderRow);
                
                // store reference for later toggle operations
                if(!this.groupHeaderElements) this.groupHeaderElements = {};
                this.groupHeaderElements[groupValue] = groupHeaderRow;
                
                // add rows for this group
                for(let i = 0; i < groupRows.length; i++) {
                    const rowData = groupRows[i];
                    if(rowData.id === undefined) rowData.id = (new Date()).getTime();
                    
                    // add row with group information
                    this.addRow(rowData, false, false, rowIndex, groupValue, isCollapsed);
                    rowIndex++;
                }
            }
        }
    }
    
    /**
     * Create group header row element
     * @param {String} groupValue 
     * @param {Number} rowCount 
     * @param {Boolean} isCollapsed 
     * @returns {HTMLElement}
     */
    createGroupHeader(groupValue, rowCount, isCollapsed) {
        const headerRow = document.createElement('tr');
        headerRow.classList.add('table-group-header');
        headerRow.dataset.groupValue = groupValue;
        headerRow.dataset.isGroupHeader = 'true';
        headerRow.dataset.collapsed = isCollapsed;
        
        headerRow.style.display = 'table-row';
        
        const cell = document.createElement('td');
        cell.setAttribute('colspan', this.config.headers.length);
        
        const icon = document.createElement('span');
        icon.classList.add('group-toggle-icon');
        icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        icon.innerHTML = '&#8250;';
        
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('group-title-text');
        
        // use custom formatter if provided
        let formattedText = '';
        if(this.config.groupFormatter !== null) {
            try {
                formattedText = this.config.groupFormatter(groupValue, rowCount);
            } catch(e) {
                console.error('Error in groupFormatter:', e);
                formattedText = `${groupValue} (${rowCount} öğe)`;
            }
        } else {
            formattedText = `${groupValue} (${rowCount} öğe)`;
        }
        titleSpan.textContent = formattedText;
        
        cell.appendChild(icon);
        cell.appendChild(titleSpan);
        headerRow.appendChild(cell);
        
        // add click handler
        const self = this;
        const currentGroupValue = groupValue;
        headerRow.onclick = (e) => {
            e.stopPropagation();
            self.toggleGroup(currentGroupValue, headerRow);
        };
        
        return headerRow;
    }
    
    /**
     * Toggle group collapse/expand state
     * @param {String} groupValue 
     * @param {HTMLElement} groupHeaderRow - Optional: the header row element
     */
    toggleGroup(groupValue, groupHeaderRow = null) {
        // toggle collapsed state
        this.config.groupCollapsed[groupValue] = !this.config.groupCollapsed[groupValue];
        const isCollapsed = this.config.groupCollapsed[groupValue];
        
        // use provided header row or find it
        let headerRow = groupHeaderRow;
        if(!headerRow) {
            // Fallback: find all headers and match by dataset
            const allHeaders = this.config.body.querySelectorAll('tr[data-is-group-header="true"]');
            for(let i = 0; i < allHeaders.length; i++) {
                if(allHeaders[i].dataset.groupValue === groupValue) {
                    headerRow = allHeaders[i];
                    break;
                }
            }
        }
        
        if(headerRow) {
            headerRow.dataset.collapsed = isCollapsed;
            
            // update icon
            const icon = headerRow.querySelector('.group-toggle-icon');
            if(icon) {
                icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        }
        
        // find all rows in this group
        const groupRows = this.config.body.querySelectorAll(`tr[data-group]`);
        let matchedRows = 0;
        groupRows.forEach(row => {
            if(row.dataset.group === groupValue) {
                row.style.display = isCollapsed ? 'none' : '';
                row.dataset.collapsed = isCollapsed;
                matchedRows++;
            }
        });
        
        // trigger callback
        if(this.config.groupToggleCallback !== null) {
            this.config.groupToggleCallback(groupValue, isCollapsed);
        }
    }
    
    //#endregion
}

