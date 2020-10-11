<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    class Responder{
        private $request;

        private $data = array();

        function __construct($data){
            //read request
            $this->request = json_decode($data,true);

            //simulate data container
            for($i=0;$i<95;$i++){
                array_push($this->data,array(
                    'id'=>$i,
                    'title'=>"title_$i",
                    'someDate' => date('Y-m-d H:i', strtotime("today +".$i." days +".$i." hours"))
                ));
            }
        }


        function returnData(){
            $lastData = array();
            $pageCount = ceil(count($this->data) / ($this->request['scale']['limit'])); //calculate page count
            //simulate order
            if(isset($this->request['order'])){
                usort($this->data,function($first,$second){
                    switch($this->request['order']['type']){
                        default:
                            $first = strtolower($first[$this->request['order']['key']]);
                            $second = strtolower($second[$this->request['order']['key']]);
                            break;
                        case 'number':
                            $first = floatval($first[$this->request['order']['key']]);
                            $second = floatval($second[$this->request['order']['key']]);
                            break;
                        case 'date':
                            $first = new DateTime($first[$this->request['order']['key']]);
                            $second = new DateTime($second[$this->request['order']['key']]);
                            break;
                    }
                    return $this->request['order']['style'] == 'asc' ? $first > $second : $first < $second;
                });
            }



            //simulate limit
            if(isset($this->request['scale'])){
                if($this->request['scale']['limit'] != '-1'){
                    //filter data  (simulate db limit query)
                    $lastData = array_slice($this->data,
                        (intVal($this->request['scale']['page'])-1)*intVal($this->request['scale']['limit']), //start from
                        intVal($this->request['scale']['limit']) // end here
                    );
                }
            }

            return array(
                'data'          => $lastData,
                'pageCount'     => $pageCount,
                'totalCount'    => count($this->data),
                'filteredCount' => count($lastData),
                'debug'         => (intVal($this->request['scale']['page'])-1)*intVal($this->request['scale']['limit'])
            );
        }

    }


print_r(json_encode((new Responder($_POST['tableReq']))->returnData()));
die;


