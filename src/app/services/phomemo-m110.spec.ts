import { TestBed } from '@angular/core/testing';

import { PhomemoM110 } from './phomemo-m110';

describe('PhomemoM110', () => {
  let service: PhomemoM110;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhomemoM110);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
