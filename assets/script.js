import Page    from '../../../bin/parents/page.js';

import Plib from '../../../../services/Plib.js';
import PickleTable  from '../../../../assets/table/pickletable.js';
import PickleContext  from '../../../../assets/context/picklecontext.js';

export default class Clients extends Page{

    async render(){
        this.styles = [
            'views/pages/'+this.constructor.name+'/page.css?v='+(new Date).getTime(),
            'assets/table/pickletable.css?v='+(new Date).getTime(),
            'assets/table/theme.css?v='+(new Date).getTime(),
            'assets/context/picklecontext.css?v='+(new Date).getTime()
        ]
        //render page
        await this.view(`<section class="main_section fade-in">
                            
                                <div class="d-flex flex-column-fluid">
                                    <div class="container">
                                        <div class="card card-custom mb-2" id="div_list">
                                            <div class="card-body ">
                                                <div class="row">
                                                    <div class="col-2">
                                                        <div class="input-icon">
															<input type="text" name="free" class="form-control elm_filter" placeholder="Serbest Arama">
															<span>
																<i class="flaticon2-search-1 icon-md"></i>
                                                            </span>
                                                        </div>  
                                                    </div>
                                                    <div class="col-2">
                                                        <select name="ftype" class="form-control elm_filter" id="sel_btype">
                                                            <option selected value="">Tip Seçiniz</option>
                                                            <option value="M">Müşteri</option>
                                                            <option value="T">Tedarikçi</option>
                                                            <option value="P">Personel</option>
                                                            <option value="G">Gider Kartı</option>
                                                        </select>
                                                    </div>
                                                    <div class="col-2">
                                                        <select name="company_structure_id" id="sel_cstype"  class="form-control elm_filter">
                                                            <option selected value="">Şirket Tip Seçiniz</option>
                                                            
                                                        </select>
                                                    </div>
                                                    <div class="col-3">
                                                        <button id="btn_filter" type="button" class="btn btn-danger btn-block">Ara</button>
                                                    </div>
                                                    <div class="col-3">
                                                        <button id="btn_filter_reset" type="button" class="btn btn-warning btn-block">Temizle</button>
                                                    </div>
                                                </div>    
                                            </div>
                                        </div>
                                        <div class="card card-custom" id="div_list">
                                            <div class="card-header flex-wrap justify-content-end border-0 pt-6 pb-0">
                                                <div class="card-toolbar">
                                                    <div class="dropdown dropdown-inline mr-2">
                                                        <button type="button" class="btn btn-secondary font-weight-bolder dropdown-toggle" id="dropdownMenuButton2" data-bs-toggle="dropdown" aria-expanded="false">
                                                            <i class="flaticon-more-1 icon-md"></i>
                                                            Sütunlar
                                                        </button>
                                                        <!--begin::Dropdown Menu-->
                                                        <div class="dropdown-menu dropdown-menu-sm dropdown-menu-right" aria-labelledby="dropdownMenuButton2">
                                                            <!--begin::Navigation-->
                                                            <ul class="navi flex-column navi-hover py-2" id="list_column">
                                                                <li class="navi-header font-weight-bolder text-uppercase font-size-sm text-primary pb-2">Sütun Seçiniz:</li>
                                                                
                                                            </ul>
                                                            <!--end::Navigation-->
                                                        </div>
                                                        <!--end::Dropdown Menu-->
                                                    </div>
                                                    <!--begin::Dropdown-->
                                                    <div class="dropdown dropdown-inline mr-2">
                                                        <button type="button" class="btn btn-light-primary font-weight-bolder dropdown-toggle" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                                            <i class="flaticon-edit icon-md"></i>
                                                            Export
                                                        </button>
                                                        <!--begin::Dropdown Menu-->
                                                        <div class="dropdown-menu dropdown-menu-sm dropdown-menu-right" aria-labelledby="dropdownMenuButton1">
                                                            <!--begin::Navigation-->
                                                            <ul class="navi flex-column navi-hover py-2">
                                                                <li class="navi-header font-weight-bolder text-uppercase font-size-sm text-primary pb-2">Çıktı Seçiniz:</li>
                                                                <li class="navi-item">
                                                                    <a href="javascript:;" data-type="print" class="navi-link selectable-icon export_item">
                                                                        <span class="navi-icon">
                                                                            <i class="la la-print"></i>
                                                                        </span>
                                                                        <span class="navi-text">Print</span>
                                                                    </a>
                                                                </li>
                                                                <li class="navi-item">
                                                                    <a href="javascript:;" data-type="excel" class="navi-link selectable-icon export_item">
                                                                        <span class="navi-icon">
                                                                            <i class="la la-file-excel-o"></i>
                                                                        </span>
                                                                        <span class="navi-text">Excel</span>
                                                                    </a>
                                                                </li>
                                                                <li class="navi-item">
                                                                    <a href="javascript:;" data-type="csv" class="navi-link selectable-icon export_item">
                                                                        <span class="navi-icon">
                                                                            <i class="la la-file-text-o"></i>
                                                                        </span>
                                                                        <span class="navi-text">CSV</span>
                                                                    </a>
                                                                </li>
                                                            </ul>
                                                            <!--end::Navigation-->
                                                        </div>
                                                        <!--end::Dropdown Menu-->
                                                    </div>
                                                    <!--end::Dropdown-->
                                                    <!--begin::Button-->
                                                    <a href="/#/clients_edit" type="button" class="btn btn-danger font-weight-bolder">
                                                        <i class="flaticon2-plus"></i> Yeni Cari
                                                    </a>
                                                    <!--end::Button-->
                                                </div>
                                            </div>
                                            
                                            <div class="card-body" style="height:60vh" id="div_table">
                                                <div class="row">
                                                    <div class="col-sm-12" style="height: 55vh;">
                                                        <div id="tbl_clients"></div>
                                                    </div>
                                                </div>    
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                        </section>`);
    }


    async afterRender(){
        await this.build();
        await this.events();
        if(this.renderCallback !== null) this.renderCallback(this.referance);
    }

    async build(){
        this.container = {};
        this.plib = new Plib();
        this.urlParams = JSON.parse(sessionStorage.getItem('params'));

        //build table
        this.getClients();
        this.buildFilters();
    }


    async events(){
        //listen table search
        document.getElementById('btn_filter').addEventListener('click',e=>{
            const elms = this.plib.checkForm('.elm_filter');
            const filter = [];
            for(let key in elms.obj){
                filter.push({
                    key:key, // column key
                    type:'=', // filtering type ('like','<','>')
                    value:elms.obj[key] //wanted column value
                });
            }
            if(this.urlParams.type !== undefined){
                filter.push({
                    key   : 'ftype',
                    type  : '=',
                    value : this.urlParams.type.toUpperCase()
                });
            }
            this.clitable.setFilter(filter);
        });

        document.getElementById('btn_filter_reset').addEventListener('click',e=>{
            const elms = this.plib.clearElements('.elm_filter');
            if(this.urlParams.type !== undefined){
                this.clitable.setFilter([{
                    key   : 'ftype',
                    type  : '=',
                    value : this.urlParams.type
                }]);
            }else{
                this.clitable.setFilter();
            }
            
        });

        //listen export options
        document.querySelectorAll('.export_item').forEach(el=>{
            el.addEventListener('click',e=>{
                Swal.fire({
                    title: 'Çıktı Hazırlanıyor ...',
                    allowOutsideClick: () => !Swal.isLoading(),
                    onOpen:()=>Swal.showLoading()
                });
                const elms = this.plib.checkForm('.elm_filter');
                const filter = [];
                for(let key in elms.obj){
                    filter.push({
                        key:key, // column key
                        type:'=', // filtering type ('like','<','>')
                        value:elms.obj[key] //wanted column value
                    });
                }
                this.plib.request({
                    method:'POST',
                    url: '/table/clients',
                    data:{
                        tableReq : JSON.stringify({
                            filters : filter
                        })
                    }
                }).then(rsp => {
                    const data = [];
                    const l = rsp.data.length
                    for(let i=0;i<l;i++){
                        const row = [];
                        //set headers
                        if(i == 0){
                            data.push(Object.keys(rsp.data[i]));
                        }
                        //set values
                        for(let key in rsp.data[i]){
                            row.push(rsp.data[i][key]);
                        }
                        data.push(row);
                    }
                    this.plib.exportData(e.target.dataset.type,data);
                    Swal.close();
                });
            })
        });
    }

    /**
     * this method will get categories from api
     */
    async getClients(){
        this.current = 0;
        this.headers = [{
            title:'Kod',
            key:'c_code',
            width:'10%',
            order:true,
            headAlign:'center',
            type:'string', // if column is number then make type number
        },{
            title:'Başlık',
            key:'title',
            order:true,
            headAlign:'center',
            type:'string', // if column is number then make type number
        },{
            title:'Tip',
            key:'ftype',
            width:'7%',
            order:true,
            colAlign:'center',
            headAlign:'center',
            type:'string', // if column is number then make type number
        },{
            title:'Şirket Türü',
            key:'company_type',
            colAlign:'center',
            order:true,
            headAlign:'center',
            type:'string', // if column is number then make type number
        },{
            title:'P.Birim',
            key:'cur',
            width:'10%',
            order:true,
            colAlign:'center',
            headAlign:'center',
            type:'string', // if column is number then make type number
        },{
            title:'Fiyat',
            key:'list_price',
            width:'10%',
            colAlign:'center',
            headAlign:'center',
            order:true,
            type:'string', // if column is number then make type number
        },{
            title:'#',
            key:'#',
            width:'10%',
            headAlign:'center',
            colAlign:'center',
            columnFormatter:(elm,rowData,columnData)=>{
                elm.classList.add('btn_client_options');
                elm.dataset.id = rowData.id;
                elm.dataset.title = rowData.title;
                return '<i  class="flaticon2-list" style="pointer-events:none;"></i>';
            },
        },]
        const options = {
            container:'#tbl_clients',
            headers:this.headers,
            type:'ajax',
            pageLimit:50,
            columnSearch : true,
            paginationType : 'scroll',// scroll - number
            ajax:{
                url: '/src/passage.php?url=/table/clients',
                data:{
                    //order:{},
                }
            },
        }
        
        
        //get list type
        if(this.urlParams.type !== undefined){
            options.initialFilter = [
                {
                    key   : 'ftype',
                    type  : '=',
                    value : this.urlParams.type.toUpperCase()
                }
            ];
        }



        this.clitable = new PickleTable(options);

        //table menu
        const context = new PickleContext({
            //target
            c_target: 'btn_client_options',
            //nodes
            c_nodes: [/*{
                icon: 'flaticon-list-3',
                title: 'Hareketler',
                //context button click event
                onClick: (node) => {
                    sessionStorage.setItem('trans_id',node.dataset.id);
                    sessionStorage.setItem('trans_type',1);
                    sessionStorage.setItem('trans_title',node.dataset.title);
                    window.location.href = '/#/transactions';
                }
            },*/{
                icon: 'flaticon-edit',
                title: 'Düzenle',
                //context button click event
                onClick: (node) => {
                    sessionStorage.setItem('edit',node.dataset.id);
                    window.location.href = '/#/clients_edit';
                }
            },{
                icon: 'flaticon2-cross',
                title: 'Sil',
                //context button click event
                onClick: (node) => {
                    this.plib.setLoader('#div_table');
                    this.plib.request({
                        method:'DELETE',
                        url: '/request/clients/'+node.dataset.id,
                    }).then(rsp => {
                        if(rsp.success){
                            this.clitable.deleteRow(node.dataset.id);
                        }
                        this.plib.toast(
                            rsp.success ? 'success' : 'error',
                            rsp.success ? 'Girdiler Kaydedildi' : 'Hata Oldu !'
                        );
                        this.plib.setLoader('#div_table',false);
                    });
                }
            }]
        });

        //set column list
        const list = document.getElementById('list_column');

        for(let i=0;i<this.headers.length;i++){
            list.innerHTML  += `<li class="navi-item">
                                    <a href="javascript:;" class="navi-link selectable-icon hide_column" data-status="1" data-child="${i+1}">
                                        <span class="navi-icon">
                                            <i class="flaticon2-check-mark"></i>
                                        </span>
                                        <span class="navi-text">${this.headers[i].title}</span>
                                    </a>
                                </li>`;
        }

        //listen column hide show event
        document.getElementById('list_column').addEventListener('click',e=>{
            e.preventDefault();
            if(e.target.classList.contains('hide_column')){
                const elms = document.querySelectorAll('.divTable tr > *:nth-child('+e.target.dataset.child+')');
                if(e.target.dataset.status == '0'){
                    //remove rule
                    e.target.dataset.status = 1;
                    e.target.querySelector('i').setAttribute('class','flaticon2-check-mark');
                    e.target.parentNode.classList.remove('invalid-border');
                }else{
                    //add rule
                    e.target.parentNode.classList.add('invalid-border');
                    e.target.querySelector('i').setAttribute('class','flaticon2-cross');
                    e.target.dataset.status = 0;
                }
                for(let i=0;i<elms.length;i++){
                    elms[i].style.display = parseInt(e.target.dataset.status) == 1 ? '' : 'none';
                }
            }
        });
    }


    async buildFilters(){
        //get company types
        await this.plib.request({
            method:'POST',
            url: '/query/sys_options',
            data:{
                tab_title : 'clients',
                col_title : 'company_structure_id'
            }
        }).then(rsp => {
            if(rsp.success){
                const sel = document.getElementById('sel_cstype');
                for(let i=0;i<rsp.data.length;i++){
                    const op = document.createElement('option');
                    op.text = rsp.data[i].title;
                    op.value = rsp.data[i].id;
                    sel.appendChild(op);
                }
            }
        });

        if(this.urlParams.type !== undefined){
            document.querySelector('.elm_filter[name="ftype"]').value = this.urlParams.type.toUpperCase();
        }


        //get client types

        


        /*await this.plib.request({
            method:'POST',
            url: '/query/sys_options',
            data:{
                tab_title : 'banks'
            }
        }).then(rsp => {
            if(rsp.success){
                const sel = document.getElementById('sel_btype');
                for(let i=0;i<rsp.data.length;i++){
                    const op = document.createElement('option');
                    op.text = rsp.data[i].title;
                    op.value = rsp.data[i].id;
                    sel.appendChild(op);
                }
            }
        });*/
    }
}

