export default class PickleTable {
    constructor(config){
        this.config = {
            referance:null,
            container:'', // target contianer for build
            headers:[], //table headers (object)
            type:'local', //data type local or ajax 
            pageCount:0, //table page count (will calculating later)
            pageLimit:10, //table page limit
            currentPage:1, //table current page
            data:[]
        };  


        for(let key in config){
            if(this.config[key] !== undefined) this.config[key] = config[key];
        }

        console.log(this.config);
        console.log('table constructed');


        this.build();
    }

    build(){
        //at this area wee will building table element
        //get referance
        this.config.referance = document.querySelector(this.config.container);
        //set class targeter
        this.config.referance.classList.add('pickletable');

        //build headers and table skeleton
        const table = document.createElement('table');
        const headers = document.createElement('thead');
        const body = document.createElement('tbody');

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
        
        headers.appendChild(row);
        body.appendChild(this.getData());
        table.appendChild(headers);
        table.appendChild(body);

        
        this.config.referance.appendChild(table);




    }
}