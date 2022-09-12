

# Pickle Table

> Pickle table is a table component written as completely pure javascript. Just put a data array or url data endpoint and have fun :-D 

> Pickle table does't need anything except you !

**Badges Falan**

- Simple javascript ability
- Simple css ability for some style editing for your project




## Initiation And Using Example 
> Demo Page : http://table.picklecan.me/

> Initiate like this :

```javascript
//set headers
const headers = [
  {
      title:'Id',
      key:'id',
      width:'10%',
      order:true,
      headAlign:'center', //text center will add to column header
      colAlign:'center',  //text center will add to all columns
      type:'number', // if column is number then make type number
      searchCallback: (value,elm) => console.log(value,elm) // column input search callback
  },
  {
      title:'Title',
      key:'title',
      order:true,
      type:'string', // if column is string then make type string
      columnFormatter:(elm,rowData,columnData)=>{
          //this method will manuplate column content
          //console.log(elm,rowData);
          return columnData+'_formattedd..';
      },
      columnClick:(elm,rowData)=>{
          //this method will manuplate column content
          //console.log(elm,rowData);
          in_log.innerHTML = 'column clicked.. =>'+rowData.id+'\n' + in_log.innerHTML;
          console.log('column clicked..',elm);
      },
  },
  {
      title:'Falan',
      key:'falan',
      width:'10%',
      order:true,
      type:'number', // if column is number then make type number
  },
  {
      title:'Some Date',
      key:'someDate',
      order:true,
      type:'date', // if column is string then make type string
      columnFormatter:(elm,rowData,columnData)=>{
          //this method will manuplate column content
          //console.log(elm,rowData);

          return columnData+'_formattedd..';
      },
      columnClick:(elm,rowData)=>{
          //this method will manuplate column content
          //console.log(elm,rowData);
          //console.log('column clicked..',elm);
      },
  }
]
//build table with local data
//create data
let data = [];
for(let i=0;i<35;i++){
  data.push({
      falan: i < 20 ? 1 : 0,
      id:i+1,
      title:'title'+i,
      someDate:moment().add(i, 'days').add(i, 'hours').format('YYYY-MM-DD H:mm:ss') //format must be like this for data ordering
  });
}
//initiate table
const table = new PickleTable({
  container:'#div_table', //table target div
  headers:headers,
  pageLimit:10, // -1 for closing pagination
  //row formatting callback
  rowFormatter:(elm,data)=>{
      //console.log(elm,data);
      //modify row element
      //elm.style.backgroundColor = 'yellow';
      //modify data
      data.rowAdded = 'i im added from row';
      return data;
  },
  columnSearch : true, // true - false for opening and closig
  paginationType : 'number',// scroll - number (number for default)
  initialFilter:[
      {
          key:'someDate',
          type:'like',
          value:moment().format('YYYY-MM-DD')
      },
      {
          key:'falan',
          type:'=',
          value:1
      }
  ],
  //row click callback
  rowClick:(elm,data)=>{
       in_log.innerHTML = 'row clicked.. =>'+rowData.id+'\n' + in_log.innerHTML;
      //console.log(elm,data);
  },
  afterRender:(currentData,currentPage)=>{
      in_log.innerHTML = 'table rendered ..\n' + in_log.innerHTML;
  },
  pageChanged:(currentData,currentPage)=>{
      in_log.innerHTML = 'page changed.. =>'+currentPage+'\n' + in_log.innerHTML;
      //console.log(currentData,currentPage);
  },
  type : 'local',
  data : data
});



//or create table with ajax soource
const table = new PickleTable({
  container:'#div_table',
  headers:headers,
  type:'ajax',
  columnSearch : true, // true - false for opening and closig
  paginationType : 'number',// scroll - number (number for default)
  initialFilter:[
      /*{
          key:'someDate',
          type:'like',
          value:moment().format('YYYY-MM-DD')
      },*/
      /*{
          key:'falan',
          type:'=',
          value:1
      }*/
  ],
  //row formatting callback
  rowFormatter:(elm,data)=>{
      //console.log(elm,data);
      //modify row element
      //elm.style.backgroundColor = 'yellow';
      //modify data
      data.rowAdded = 'i im added from row';
      return data;
  },
  //row click callback
  rowClick:(elm,data)=>{
      in_log.innerHTML = 'row clicked.. =>'+rowData.id+'\n' + in_log.innerHTML;
      console.log(elm,data);
  },
  afterRender:(currentData,currentPage)=>{
      in_log.innerHTML = 'table rendered ..\n' + in_log.innerHTML;
  },
  pageChanged:(currentData,currentPage)=>{
      in_log.innerHTML = 'page changed.. =>'+currentPage+'\n' + in_log.innerHTML;
      //console.log(currentData,currentPage);
  },
  pageLimit:20, // put '-1' for getting all data
  ajax:{
      url:'src/responder.php',
      data:{
          //order:{},
      }
  },
});

```

---

> After that you can use some addional events for node like those:

```javascript

//add new row to table :
table.addRow({
       id:(new Date).getTime(),
       title:document.getElementById('in_title').value.trim(),
});

//update table row with id (in this example row id is  '1')
table.updateRow(1,{
     title:'i m updated title',
});

//deleting table row with id (in this example row id is  '1')
table.deleteRow(1);

//get table row from current page with id (in this example row id is  '1')
table.getRow(1);

//set custom filter for table
table.setFilter(
   [{
       key:'falan', // column key
       type:'=', // filtering type ('like','<','>')
       value:'filter value' //wanted column value
   }]
);

//resetting filters
table.setFilter();

//removing all data inside of table
table.clearData();

```

---

## Installation

- Just include js and css file to your project then you can use it

### Clone

- Clone this repo to your local machine using `https://github.com/freakazoid41/pickle_table.git`

