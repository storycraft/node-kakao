/*
 * Created on Sun May 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


import { StructConverter, StructMapper, WrappedStruct, ConvertMap } from "../src/talk/struct/struct-base";
import { assert } from "chai";

interface TestObj {

    text: string

}

let testMapping = {

    't': 'text',

    

    'text': 't'

}

const TestConvertMap: ConvertMap = {

    text: StructConverter.STRING

}

describe('mapping test', () => {

    it('read from wrapped', () => {
        let original = {'t': 'text'};
        let wrapped = new WrappedStruct<TestObj>(original, new StructMapper(testMapping, TestConvertMap)) as any;
    
        assert.isTrue(wrapped.text === 'text');
    });

    it('write from wrapped', () => {
        let original = {'t': 'asd'};
    
        let wrapped = new WrappedStruct<TestObj>(original, new StructMapper(testMapping, TestConvertMap)) as any;

        wrapped.text = 'asdf';
    
        assert.isTrue(original.t === 'asdf');
    });

});