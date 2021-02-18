/*
 * Created on Sun Oct 13 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { RequestForm } from './web-client';

export function convertToFormData(form: RequestForm): URLSearchParams {
  const formData = new URLSearchParams();

  for (const [key, value] of Object.entries(form)) {
    // hax for undefined, null values
    formData.append(key, value + '');
  }

  return formData;
}