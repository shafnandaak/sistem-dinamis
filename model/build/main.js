#!/usr/bin/env node
import { execJsModel } from '@sdeverywhere/runtime'
import loadJsModel from './SFDmodel1-edit6-koreksi.js'
execJsModel(await loadJsModel())
