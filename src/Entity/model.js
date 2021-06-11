export default class Model {
    constructor(){
        this.lines = [
            /* 
            {
                pt0: [1.0, 1.0],
                pt1: [2.0, 2.0]
            } */
           
        ];
    }

    insertCurve({curve}){
        this.lines.push(curve);
    }
}