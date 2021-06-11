import Model from "./model";

export default class collector {
    constructor(){
        this.curve = null;
        this.model = new Model();
    }

    startCollection(){
        this.curve = {
            pt0: null,
            pt1: null
        }
    }

    insertPoint({x, y}){
        if (this.curve.pt0) {
            this.curve.pt1 = [x, y];
        }
        else
        {
            this.curve.pt0 = [x, y];
        }
    }

    isCollecting(){
        if(this.curve){
            return true;
        }
        else
        {
            return false;
        }
    }

    isFinished(){
        if(this.curve.pt1){
            return true;
        }
        else
        {
            return false;
        }
    }

    endCollection(){
        this.model.insertCurve({curve: this.curve});
        this.curve = null;
    }
}