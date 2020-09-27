export default class PickleTable {
    constructor(config){
        this.config = {
            referance:null,
            container:'', // target contianer for build
            headers:[], //table headers (object)
            type:'local', //data type local or ajax 
            pageCount:1, //table page count (will calculating later)
            pageLimit:10, //table page limit
            data:[],
            currentPage:1, //table current page
            currentData:{} //table current data
        };  

        //set custom table config
        for(let key in config){
            if(this.config[key] !== undefined) this.config[key] = config[key];
        }


        //if data is local set page count
        if(this.config.type === 'local' && this.config.data.length>0) this.config.pageCount = Math.ceil(this.config.data.length / this.config.pageLimit);


        //build table
        this.build();
        //set data
        this.getData();
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
    getData(/*order = null,filter = null*/){
        if(this.config.type === 'local'){
            //get page values
            const data = this.config.data.slice((this.config.currentPage-1)*this.config.pageLimit , this.config.currentPage*this.config.pageLimit);
            for(let i=0;i<data.length;i++){
                if(data[i].id === undefined) data[i].id = (new Date).getTime();
                this.config.currentData[data[i].id] = data[i];
                //set row to table
                this.addRow(data[i]);
            }
        }else{
            //get data via ajax
        }

        //create pagination
        let start = 1;
        let end = 7;
        if(this.config.currentPage  > 5){
            start = page-3;
            end = page+3
        }
        this.config.pagination.innerHTML = '';
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
    }



    
    /**
     * this method will set data from data container or ajax target
     */
    addRow(data){
        const row = document.createElement('tr');
        for(let i = 0;i<this.config.headers.length;i++){
            const column = document.createElement('td');
            column.innerHTML = data[this.config.headers[i].key];
            row.appendChild(column);
        }
        console.log(row)
        this.config.body.appendChild(row);
    }

}