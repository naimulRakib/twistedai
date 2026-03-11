#ifndef MINHEAP_H
#define MINHEAP_H

#include <iostream>
#include <fstream>
#include <stdexcept>
#include <climits>

#define MAX_CAPACITY 1000  // Defines the maximum capacity of the heap
using namespace std;


class MinHeap
{
private:
    int heap[MAX_CAPACITY];  // Array to store heap elements
    int size;                // Current number of elements in the heap

    /**
     * Sifts up the node at index i to maintain heap property.
     */
    void siftUp(int i)
    {
        while (i>0)
        {
            int parent = (i-1)/2;
            if (heap[parent] > heap [i])
            {
                int temp = heap[parent] ; 
                heap[parent]= heap[ i];
                heap[i]= temp ; 
                i = parent ;  

            }
            else break;
        }
    }

    /**
     * Sifts down the node at index i to maintain heap property.
     */
    void siftDown(int i)
    {

        int minimumIdx = i; 
        int l = 2*i +1;
        int r= 2*i+2;
        if(l<size && heap[l]<heap[minimumIdx])
        {
            minimumIdx = l;
        }
     if (r<size && heap[r]< heap[minimumIdx])
        {
            minimumIdx = r;

        }

        if(i!= minimumIdx)
        {
           int temp = heap [i];
           heap[i] =heap[minimumIdx];
           heap[minimumIdx] = temp ; 
        siftDown(minimumIdx);

        }
        /**Write your code here**/
    }

public:
    // Constructor initializes an empty heap
    MinHeap() : size(0) {}

    /**
     * Inserts a new element x into the heap.
     */
    void insert(int x)
    {

        if(size >= MAX_CAPACITY) return ; 
        heap[size ]= x;
        siftUp(size);
        size++;

        /**Write your code here**/
    }

    /**
     * Returns the minimum element without removing it.
     */
int findMin()
    {
        if(size == 0) throw std::out_of_range("Heap is empty");
        return heap[0];
    }


    
    /**
     * Removes and returns the minimum element from the heap.
     */
    int extractMin()
    {
        if (size == 0) throw std::out_of_range("Heap is empty");
        int minValue = heap[0];
        heap[0] = heap[size - 1];
        size--;
        siftDown(0);
        return minValue;

        /**Write your code here**/
    }

    /**
     * Returns the number of elements in the heap.
     */
    int getSize()
    {

        return size ;
        /**Write your code here**/
    }

    /**
     * Checks if the heap is empty.
     * Returns true if empty, false otherwise.
     */
    bool isEmpty()
    {
        return size ==0 ; 

        /**Write your code here**/
    }

    /**
     * Decreases the value of the element at index i to newValue.
     */
    void decreaseKey(int i, int newValue)

    {
        if (i<0 || i>=size)
        return;
        heap[i]= newValue;
        siftUp(i);

        /**Write your code here**/
    }

    /**
     * Deletes the element at index i.
     */
    void deleteKey(int i)
    {
        if(i<0 ||i >=size) return;
        decreaseKey(i, INT_MIN);
        extractMin();

        /**Write your code here**/
    }

    /**
     * Prints the heap's content to the output file.
     * Format: "elem1 elem2 elem3 ..." (space-separated)
     */
    void printHeap(std::ofstream &outfile)
    {
        for (int i = 0; i < size; i++)
        {
            outfile << heap[i] << (i == size - 1 ? "" : " ");
        }
        outfile << std::endl;

        /**Write your code here**/
    }

    /**
     * Checks whether the Min Heap property is preserved.
     * Returns true if valid, false otherwise.
     */
    bool isValidMinHeap()
    {
        for (int i = 0 ; i< size; i++)
        {
            int left = 2*i+1;
            int right = 2*i+2; 
             if(left<size && heap[left]<heap[i]){return false;}
             if (right<size && heap[right]<heap[i]){return false ; 
            }
        }
        return true ; 



        /**Write your code here**/
    }

    /**
     * Builds a heap from an unsorted array using bottom-up heapify.
     */
    void heapify(int arr[], int n)
    {
        
        if (n > MAX_CAPACITY) return;
        size = n;
        for (int i = 0; i < n; i++)
        {
            heap[i] = arr[i];
        }
        
        for (int i = (size / 2) - 1; i >= 0; i--)
        {
            siftDown(i);
        }


        /**Write your code here**/
    }

    /**
     * Returns all elements in sorted (ascending) order.
     * The original heap should remain UNCHANGED after this operation.
     */
    void heapSort(std::ofstream &outfile)
    {   int realSize = size ; 
        int realHeap[MAX_CAPACITY];
        for (int i=0; i < size; i++)
        {
            realHeap[i]= heap[i];

        }
for(int i=0; i <realSize; i++)
{
    outfile << extractMin() << (i == realSize - 1 ? "" : " ");
}
outfile<<std::endl; 
size = realSize;
for (int i = 0; i < size; i++)
        {
            heap[i] = realHeap[i];
        }


        /**Write your code here**/
    }

    /**
     * Replaces the minimum element with a new value x in a single operation.
     * Returns the old minimum value.
     */
    int replaceMin(int x)
    {if (size == 0) throw std::out_of_range("Heap is empty");
        int oldMin = heap[0];
        heap[0] = x;
        siftDown(0);
        return oldMin;
        /**Write your code here**/
    }
};

#endif // MINHEAP_H
//g++ main.cpp -o heap
//./heap